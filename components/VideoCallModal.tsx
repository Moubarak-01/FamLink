import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import Peer from 'simple-peer';
import { socketService } from '../services/socketService';
import { useLanguage } from '../contexts/LanguageContext';

// NOTE: process/Buffer polyfills are handled by vite-plugin-node-polyfills in vite.config.ts

interface VideoCallProps {
    currentUserId: string;
    currentUserName: string;
    outgoingCallTarget: string | null;
    outgoingCallName?: string | null;
    callType?: 'video' | 'voice';
    onClose: () => void;
}

// Global variable to track active call state outside component re-renders
let activePeer: Peer.Instance | null = null;

const VideoCallModal: React.FC<VideoCallProps> = ({ currentUserId, currentUserName, outgoingCallTarget, outgoingCallName, callType = 'video', onClose }) => {
    const { t } = useLanguage();

    // UI State
    const [callActive, setCallActive] = useState(false);
    const [incomingCall, setIncomingCall] = useState<{ from: string, name: string, signal: any, callType: 'video' | 'voice' } | null>(null);
    const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'receiving' | 'connecting' | 'connected'>('idle');
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [muted, setMuted] = useState(false);
    const [cameraOff, setCameraOff] = useState(false);

    // WhatsApp-style features
    const [isLocalMain, setIsLocalMain] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [pipPosition, setPipPosition] = useState<'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'>('top-right');
    const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
    const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);

    // Audio Context for Ringtone/Dialtone
    const audioContextRef = useRef<AudioContext | null>(null);
    const oscillatorRef = useRef<OscillatorNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);

    // Video and Peer Refs
    const myVideo = useRef<HTMLVideoElement>(null);
    const userVideo = useRef<HTMLVideoElement>(null);
    const connectionRef = useRef<Peer.Instance | null>(null);
    const callTimerRef = useRef<NodeJS.Timeout | null>(null);
    const callStartTimeRef = useRef<number | null>(null);
    const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Ref to track the call target for signaling (avoids stale closure issues)
    const callTargetRef = useRef<string | null>(null);

    // --- Audio Tone Functions ---
    const playTone = (type: 'ring' | 'dial') => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioContextRef.current;
        if (oscillatorRef.current) stopTone();

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        if (type === 'ring') {
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(400, ctx.currentTime);
        } else {
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(440, ctx.currentTime);
        }

        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        oscillator.start();
        oscillatorRef.current = oscillator;
        gainNodeRef.current = gainNode;
    };

    const stopTone = () => {
        if (oscillatorRef.current) {
            oscillatorRef.current.stop();
            oscillatorRef.current.disconnect();
            oscillatorRef.current = null;
        }
        if (gainNodeRef.current) {
            gainNodeRef.current.disconnect();
            gainNodeRef.current = null;
        }
    };

    const toneIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const startRingPattern = () => {
        const play = () => {
            if (audioContextRef.current?.state === 'suspended') audioContextRef.current.resume();
            playTone('ring');
            setTimeout(() => stopTone(), 2000);
        };
        play();
        toneIntervalRef.current = setInterval(play, 3000);
    };

    const startDialPattern = () => {
        if (audioContextRef.current?.state === 'suspended') audioContextRef.current.resume();
        playTone('dial');
    };

    const stopAllSounds = () => {
        if (toneIntervalRef.current) {
            clearInterval(toneIntervalRef.current);
            toneIntervalRef.current = null;
        }
        stopTone();
    };

    // --- Call Timer ---
    const startCallTimer = () => {
        callStartTimeRef.current = Date.now();
        callTimerRef.current = setInterval(() => {
            if (callStartTimeRef.current) {
                setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000));
            }
        }, 1000);
    };

    const stopCallTimer = () => {
        if (callTimerRef.current) {
            clearInterval(callTimerRef.current);
            callTimerRef.current = null;
        }
        callStartTimeRef.current = null;
        setCallDuration(0);
    };

    const formatDuration = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // --- Camera Enumeration & Switching ---
    const enumerateVideoDevices = async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoCameras = devices.filter(d => d.kind === 'videoinput');
            setVideoDevices(videoCameras);
        } catch (err) {
            console.error('Failed to enumerate devices:', err);
        }
    };

    const switchCamera = async () => {
        if (videoDevices.length < 2 || !stream) return;

        const nextIndex = (currentDeviceIndex + 1) % videoDevices.length;
        const nextDevice = videoDevices[nextIndex];

        try {
            stream.getVideoTracks().forEach(track => track.stop());

            const newStream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: { exact: nextDevice.deviceId } },
                audio: true
            });

            if (myVideo.current) myVideo.current.srcObject = newStream;
            setStream(newStream);
            setCurrentDeviceIndex(nextIndex);

            if (connectionRef.current) {
                const videoTrack = newStream.getVideoTracks()[0];
                const sender = (connectionRef.current as any)._pc?.getSenders()?.find((s: any) => s.track?.kind === 'video');
                if (sender) {
                    sender.replaceTrack(videoTrack);
                }
            }

            console.log('📷 Switched to camera:', nextDevice.label);
        } catch (err) {
            console.error('Failed to switch camera:', err);
        }
    };

    // --- Swap Video Windows ---
    const swapVideos = () => {
        setIsLocalMain(!isLocalMain);
    };

    // --- PiP Position Cycling ---
    const cyclePipPosition = () => {
        const positions: typeof pipPosition[] = ['top-right', 'top-left', 'bottom-right', 'bottom-left'];
        const currentIndex = positions.indexOf(pipPosition);
        const nextIndex = (currentIndex + 1) % positions.length;
        setPipPosition(positions[nextIndex]);
    };

    const getPipPositionClasses = (): string => {
        switch (pipPosition) {
            case 'top-left': return 'top-6 left-6';
            case 'top-right': return 'top-6 right-6';
            case 'bottom-left': return 'bottom-24 left-6';
            case 'bottom-right': return 'bottom-24 right-6';
            default: return 'top-6 right-6';
        }
    };

    // --- Call Logic ---
    useEffect(() => {
        if (outgoingCallTarget && !callActive) {
            startCall(outgoingCallTarget);
        }
    }, [outgoingCallTarget]);

    useEffect(() => {
        if (callStatus === 'calling') {
            connectionTimeoutRef.current = setTimeout(() => {
                console.log("⏰ Call timed out after 60s");
                leaveCall();
                alert(t('call_timeout') || 'Call timed out');
            }, 60000);
        } else {
            if (connectionTimeoutRef.current) {
                clearTimeout(connectionTimeoutRef.current);
                connectionTimeoutRef.current = null;
            }
        }
    }, [callStatus]);

    useEffect(() => {
        const cleanupReceived = socketService.onCallReceived((data) => {
            console.log("📞 [VideoCall] Incoming call from:", data.name, "Type:", data.callType);
            setIncomingCall({ from: data.from, name: data.name, signal: data.signal, callType: data.callType || 'video' });
            setCallStatus('receiving');
            startRingPattern();
        });

        const cleanupAccepted = socketService.onCallAccepted((signal) => {
            console.log("✅ [VideoCall] Call Accepted — received answer SDP from peer");
            stopAllSounds();
            // Don't set 'connected' yet — wait for peer 'connect' event
            // Just feed the answer signal to the peer
            if (connectionRef.current) {
                try {
                    connectionRef.current.signal(signal);
                } catch (e) {
                    console.error("❌ Error signaling accepted:", e);
                }
            }
        });

        const cleanupIce = socketService.onIceCandidateReceived((candidate) => {
            console.log("🧊 [VideoCall] Received ICE candidate from peer");
            if (connectionRef.current) {
                try {
                    connectionRef.current.signal(candidate);
                } catch (e) {
                    console.error("❌ Error signaling ICE candidate:", e);
                }
            }
        });

        const cleanupEnded = socketService.onCallEnded(() => {
            console.log("🛑 [VideoCall] Call Ended by peer");
            leaveCall();
        });

        return () => {
            console.log("🧹 [VideoCall] Cleaning up socket listeners");
            stopAllSounds();
            stopCallTimer();
            cleanupReceived();
            cleanupAccepted();
            cleanupIce();
            cleanupEnded();
        };
    }, []);

    // ============================================================
    // startCall — CALLER side (initiator: true, trickle: true)
    // ============================================================
    const startCall = async (userToCallId: string) => {
        setCallStatus('calling');
        setCallActive(true);
        callTargetRef.current = userToCallId;
        startDialPattern();

        try {
            const constraints = {
                video: callType === 'video',
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                }
            };
            const currentStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(currentStream);
            if (myVideo.current) myVideo.current.srcObject = currentStream;

            if (callType === 'video') {
                await enumerateVideoDevices();
            }

            console.log(`🎥 [VideoCall] Got local stream (Type: ${callType}), initializing Peer (trickle: true)...`);

            const peer = new Peer({
                initiator: true,
                trickle: true,  // ← THE FIX: Send signals incrementally
                stream: currentStream,
                config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' },
                        { urls: 'stun:global.stun.twilio.com:3478' }
                    ]
                }
            });

            let offerSent = false;

            peer.on('signal', (data) => {
                if (data.type === 'offer') {
                    console.log("📡 [VideoCall] Generated Offer SDP — sending to receiver");
                    socketService.callUser(userToCallId, data, currentUserId, currentUserName, callType);
                    offerSent = true;
                } else if ((data as any).candidate) {
                    // ICE candidate — send it via the dedicated ICE channel
                    console.log("🧊 [VideoCall] Sending ICE candidate to receiver");
                    socketService.sendIceCandidate(userToCallId, data);
                } else {
                    // Fallback: other signal types
                    console.log("📡 [VideoCall] Sending other signal type:", (data as any).type);
                    if (!offerSent) {
                        socketService.callUser(userToCallId, data, currentUserId, currentUserName, callType);
                        offerSent = true;
                    } else {
                        socketService.sendIceCandidate(userToCallId, data);
                    }
                }
            });

            // P2P link established — NOW we are truly connected
            peer.on('connect', () => {
                console.log("🔗 [VideoCall] P2P Connection ESTABLISHED (Caller)");
                stopAllSounds();
                setCallStatus('connected');
                startCallTimer();
            });

            peer.on('stream', (remoteStream) => {
                console.log("📺 [VideoCall] Received Remote Stream (Caller)");
                if (userVideo.current) userVideo.current.srcObject = remoteStream;
            });

            peer.on('error', (err) => {
                console.error("❌ [VideoCall] Peer Error (Caller):", err);
                leaveCall();
            });

            peer.on('close', () => {
                console.log("🔌 [VideoCall] Peer Connection Closed (Caller)");
            });

            connectionRef.current = peer;
            activePeer = peer;
        } catch (err: any) {
            console.error("Failed to get media:", err);
            alert(t('alert_media_failed') || `Call failed: ${err.message || err.name}`);
            stopAllSounds();
            leaveCall();
        }
    };

    // ============================================================
    // answerCall — RECEIVER side (initiator: false, trickle: true)
    // ============================================================
    const answerCall = async () => {
        stopAllSounds();
        // Don't set 'connected' yet — set 'connecting' so user sees feedback
        setCallStatus('connecting');
        setCallActive(true);

        // Capture incomingCall in a local variable to avoid stale closure
        const currentIncomingCall = incomingCall;
        if (!currentIncomingCall) {
            console.error("❌ answerCall called but incomingCall is null!");
            leaveCall();
            return;
        }

        callTargetRef.current = currentIncomingCall.from;

        try {
            const isVoiceCall = currentIncomingCall.callType === 'voice';
            const constraints = {
                video: !isVoiceCall,
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                }
            };

            const currentStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(currentStream);
            if (myVideo.current) myVideo.current.srcObject = currentStream;

            if (!isVoiceCall) {
                await enumerateVideoDevices();
            }

            console.log("🎥 [VideoCall] Got local stream for Answer, initializing Peer (trickle: true)...");

            const peer = new Peer({
                initiator: false,
                trickle: true,   // ← THE FIX
                stream: currentStream,
                config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' },
                        { urls: 'stun:global.stun.twilio.com:3478' }
                    ]
                }
            });

            let answerSent = false;

            peer.on('signal', (data) => {
                if (data.type === 'answer') {
                    console.log("📡 [VideoCall] Generated Answer SDP — sending to caller:", currentIncomingCall.from);
                    socketService.answerCall({ signal: data, to: currentIncomingCall.from });
                    answerSent = true;
                } else if ((data as any).candidate) {
                    console.log("🧊 [VideoCall] Sending ICE candidate to caller");
                    socketService.sendIceCandidate(currentIncomingCall.from, data);
                } else {
                    console.log("📡 [VideoCall] Sending other signal type:", (data as any).type);
                    if (!answerSent) {
                        socketService.answerCall({ signal: data, to: currentIncomingCall.from });
                        answerSent = true;
                    } else {
                        socketService.sendIceCandidate(currentIncomingCall.from, data);
                    }
                }
            });

            // P2P link established — NOW we are truly connected
            peer.on('connect', () => {
                console.log("🔗 [VideoCall] P2P Connection ESTABLISHED (Receiver)");
                setCallStatus('connected');
                startCallTimer();
            });

            peer.on('stream', (remoteStream) => {
                console.log("📺 [VideoCall] Received Remote Stream (Receiver)");
                if (userVideo.current) userVideo.current.srcObject = remoteStream;
            });

            peer.on('error', (err) => {
                console.error("❌ [VideoCall] Peer Error (Receiver):", err);
                leaveCall();
            });

            peer.on('close', () => {
                console.log("🔌 [VideoCall] Peer Connection Closed (Receiver)");
            });

            // Feed the caller's offer into our peer — this triggers SDP answer generation
            console.log("📥 [VideoCall] Feeding caller's offer to peer...");
            peer.signal(currentIncomingCall.signal);

            connectionRef.current = peer;
            activePeer = peer;
        } catch (err: any) {
            console.error("Failed to get media:", err);
            const isVoiceCall = currentIncomingCall.callType === 'voice';
            if (!isVoiceCall) {
                alert(t('alert_camera_failed') || `Camera failed: ${err.message}. Try Audio call.`);
            } else {
                alert(t('alert_audio_failed') || `Microphone failed: ${err.name}`);
            }
            leaveCall();
        }
    };

    const leaveCall = () => {
        stopAllSounds();
        stopCallTimer();
        setCallStatus('idle');
        setCallActive(false);
        setIncomingCall(null);

        connectionRef.current?.destroy();
        connectionRef.current = null;
        activePeer = null;

        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }

        // Notify the other party
        const target = callTargetRef.current;
        if (target) {
            socketService.endCall(target);
            callTargetRef.current = null;
        }

        onClose();
    };

    const toggleMute = () => {
        if (stream) {
            setMuted(!muted);
            stream.getAudioTracks()[0].enabled = !stream.getAudioTracks()[0].enabled;
        }
    };

    const toggleCamera = () => {
        if (stream && activeCallType === 'video') {
            setCameraOff(!cameraOff);
            stream.getVideoTracks()[0].enabled = !stream.getVideoTracks()[0].enabled;
        }
    };

    const activeCallType = incomingCall ? incomingCall.callType : callType;

    // --- RENDER ---
    if (callStatus === 'idle') return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black">
            {/* Main Container */}
            <div className="relative w-full h-full flex flex-col items-center justify-center">

                {/* Incoming Call Prompt */}
                {callStatus === 'receiving' && !callActive && (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-gradient-to-br from-gray-900 to-gray-800 p-10 rounded-3xl shadow-2xl text-center z-50 border border-gray-700"
                    >
                        <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-5xl"
                        >
                            📞
                        </motion.div>
                        <h3 className="text-2xl font-bold mb-2 text-white">
                            {incomingCall?.name || t('text_unknown_user')}
                        </h3>
                        <p className="text-lg opacity-80 mb-8 text-gray-400">
                            is {incomingCall?.callType === 'voice' ? t('alert_is_calling_you') || 'calling you...' : t('alert_requesting_video_call') || 'requesting a video call...'}
                        </p>
                        <div className="flex gap-6 justify-center">
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={answerCall}
                                className="bg-green-500 hover:bg-green-600 text-white w-16 h-16 rounded-full text-2xl font-bold shadow-lg flex items-center justify-center"
                            >
                                ✓
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => { stopAllSounds(); setIncomingCall(null); setCallStatus('idle'); onClose(); }}
                                className="bg-red-500 hover:bg-red-600 text-white w-16 h-16 rounded-full text-2xl font-bold shadow-lg flex items-center justify-center"
                            >
                                ✕
                            </motion.button>
                        </div>
                    </motion.div>
                )}

                {/* Video/Voice Area */}
                {(callStatus === 'connected' || callStatus === 'calling' || callStatus === 'connecting') && (
                    <>
                        {/* Main Interaction Area */}
                        <div className="absolute inset-0 bg-gray-950 flex flex-col items-center justify-center">

                            {/* Video Elements */}
                            <div className={`absolute inset-0 bg-black ${activeCallType === 'voice' ? 'opacity-0 pointer-events-none' : ''}`}>
                                <video
                                    playsInline
                                    ref={isLocalMain ? myVideo : userVideo}
                                    autoPlay
                                    muted={isLocalMain}
                                    className="w-full h-full object-cover transition-all duration-300"
                                />
                                {/* Overlay for calling/connecting state */}
                                {(callStatus === 'calling' || callStatus === 'connecting') && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/60 z-10 backdrop-blur-sm">
                                        <div className="w-28 h-28 mb-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-6xl animate-pulse">
                                            📞
                                        </div>
                                        <p className="text-2xl font-semibold mb-2">
                                            {callStatus === 'calling' ? (t('call_ringing') || 'Ringing...') : (t('call_connecting') || 'Connecting...')}
                                        </p>
                                        <p className="text-gray-400">
                                            {callStatus === 'calling' ? (t('call_waiting_status') || 'Waiting for answer...') : (t('call_establishing') || 'Establishing connection...')}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Voice Call UI Overlay */}
                            {activeCallType === 'voice' && (
                                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-white bg-gray-950">
                                    <motion.div
                                        animate={{ scale: [1, 1.05, 1], boxShadow: ["0 0 0 0px rgba(72, 187, 120, 0.4)", "0 0 0 20px rgba(72, 187, 120, 0)", "0 0 0 00px rgba(72, 187, 120, 0)"] }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                        className="w-40 h-40 mb-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-7xl border-4 border-white/20"
                                    >
                                        {(isLocalMain ? currentUserName : (incomingCall?.name || outgoingCallName || t('text_unknown_user'))).charAt(0).toUpperCase()}
                                    </motion.div>
                                    <h2 className="text-3xl font-bold mb-2">{isLocalMain ? currentUserName : (incomingCall?.name || outgoingCallName || t('text_unknown_user'))}</h2>
                                    <p className="text-xl text-green-400 font-mono mb-8">{formatDuration(callDuration)}</p>
                                    <p className="text-gray-400">{t('text_voice_call')}</p>
                                </div>
                            )}
                        </div>

                        {/* PiP Video (Only for Video Calls) */}
                        {activeCallType === 'video' && (
                            <motion.div
                                drag
                                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                                dragElastic={0.1}
                                onClick={swapVideos}
                                className={`absolute ${getPipPositionClasses()} w-32 h-44 sm:w-40 sm:h-56 bg-gray-900 rounded-2xl border-2 border-white/20 shadow-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:border-white/50 z-20`}
                            >
                                <video
                                    playsInline
                                    muted={!isLocalMain}
                                    ref={isLocalMain ? userVideo : myVideo}
                                    autoPlay
                                    className={`w-full h-full object-cover ${cameraOff && !isLocalMain ? 'hidden' : ''}`}
                                />
                                {cameraOff && !isLocalMain && (
                                    <div className="w-full h-full flex items-center justify-center text-white text-sm bg-gray-800">
                                        {t('camera_off_status')}
                                    </div>
                                )}
                                <div className="absolute bottom-1 right-1 bg-black/50 px-2 py-0.5 rounded text-xs text-white">
                                    {isLocalMain ? t('pip_remote') : t('pip_you')}
                                </div>
                            </motion.div>
                        )}

                        {/* Call Duration Display (Video Mode) */}
                        {callStatus === 'connected' && activeCallType === 'video' && (
                            <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full text-white font-mono text-lg z-20">
                                {formatDuration(callDuration)}
                            </div>
                        )}

                        {/* Controls Bar */}
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/60 backdrop-blur-xl rounded-full px-4 py-3 border border-white/10 z-20">

                            {/* Camera Switch (Video only) */}
                            {activeCallType === 'video' && (
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={switchCamera}
                                    className={`p-3 rounded-full text-white transition-all ${videoDevices.length > 1 ? 'bg-white/10 hover:bg-white/20' : 'bg-white/5 opacity-50 cursor-not-allowed'}`}
                                    title={t('switch_camera')}
                                    disabled={videoDevices.length < 2}
                                >
                                    🔄
                                </motion.button>
                            )}

                            {/* Mute */}
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={toggleMute}
                                className={`p-4 rounded-full transition-all ${muted ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                title={muted ? t('title_unmute') : t('title_mute')}
                            >
                                {muted ? '🔇' : '🎤'}
                            </motion.button>

                            {/* End Call */}
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={leaveCall}
                                className="p-5 rounded-full bg-red-600 text-white hover:bg-red-700 shadow-lg mx-2 text-xl"
                                title={t('title_end_call')}
                            >
                                📞
                            </motion.button>

                            {/* Camera Toggle (Video only) */}
                            {activeCallType === 'video' && (
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={toggleCamera}
                                    className={`p-4 rounded-full transition-all ${cameraOff ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                    title={cameraOff ? t('title_camera_on') : t('title_camera_off')}
                                >
                                    {cameraOff ? '🚫' : '📷'}
                                </motion.button>
                            )}

                            {/* Swap Videos (Video only) */}
                            {activeCallType === 'video' && (
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={swapVideos}
                                    className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
                                    title={t('title_swap_videos')}
                                >
                                    ⇄
                                </motion.button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default VideoCallModal;
