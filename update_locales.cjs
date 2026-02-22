const fs = require('fs');
const content = fs.readFileSync('locales/parentAssessmentTranslations.ts', 'utf8');

const newQuestions = `
        pa_q_016: "A 4-year-old child keeps making inappropriate comments about another child's body. How do you address this?",
        pa_016_a: "Calmly explain that bodies are private and redirect them to another activity.",
        pa_016_b: "Shame them publicly so they know it's wrong.",
        pa_016_c: "Laugh because kids are just being kids.",
        pa_016_d: "Tell their parents they are raising a bad kid.",

        pa_q_017: "What is your stance on safe sleep practices for infants (under 1 year)?",
        pa_017_a: "Always place babies on their backs on a firm, flat surface with no loose blankets or toys.",
        pa_017_b: "Place them on their stomachs because they sleep better.",
        pa_017_c: "Let them sleep in a car seat inside the house for convenience.",
        pa_017_d: "Co-sleep in the same adult bed with lots of soft pillows to keep them warm.",

        pa_q_018: "If a child refuses to eat the lunch provided by their parent, what is your approach?",
        pa_018_a: "Offer the food without pressure and try again later if they are hungry, respecting their cues.",
        pa_018_b: "Force them to sit at the table until they finish everything on their plate.",
        pa_018_c: "Give them whatever sugary snack they want instead so they don't cry.",
        pa_018_d: "Tell them they are being ungrateful.",

        pa_q_019: "You are supervising children near a pool. What is the absolute golden rule of water safety?",
        pa_019_a: "Never take your eyes off them, maintaining constant and undivided visual supervision without distractions.",
        pa_019_b: "It's fine to look at your phone as long as you can hear splashing.",
        pa_019_c: "If they have floats on, they don't need close supervision.",
        pa_019_d: "Only watch the kids who don't know how to swim; the older ones are fine alone.",

        pa_q_020: "A parent asks you to drive their child but does not provide a car seat (the child is 3 years old). What do you say?",
        pa_020_a: "Politely refuse to drive the child until an appropriate, federally-approved car seat is provided and installed.",
        pa_020_b: "Just hold the child tightly in your lap while someone else drives.",
        pa_020_c: "Use a regular seatbelt and tell them to sit very still.",
        pa_020_d: "Agree to do it just this once because the destination is close by.",

        pa_q_021: "If you feel completely emotionally burnt out and a child keeps testing boundaries, what is the safest professional choice?",
        pa_021_a: "Acknowledge my limit, ensure the child is safe in a separate space, take a breather, and contact the parents if I cannot regain composure.",
        pa_021_b: "Take out my frustration on the child so they learn not to act up.",
        pa_021_c: "Lock them in their room and leave the house.",
        pa_021_d: "Pretend everything is fine until I explode in anger.",

        pa_q_022: "Which of the following are signs of potential grooming behavior by an adult towards a child? (Select all that apply)",
        pa_022_a: "Giving secretive, inappropriate gifts to the child.",
        pa_022_b: "Demanding to spend excessive one-on-one time with the child away from others.",
        pa_022_c: "Encouraging the child to keep secrets from their parents.",
        pa_022_d: "Helping the child with their math homework in the living room.",

        pa_q_023: "How do you handle screen time limits set by parents?",
        pa_023_a: "Strictly adhere to the time limit and provide engaging offline activities when the time is up.",
        pa_023_b: "Let them watch TV all day to make my job easier.",
        pa_023_c: "Ignore the parent's rules if the child throws a fit.",
        pa_023_d: "Use my own phone to show them videos if the TV is off-limits.",

        pa_q_024: "What is your approach to a child who bites another child?",
        pa_024_a: "Comfort the bitten child first, then firmly tell the biter 'No biting, teeth are not for hurting,' and redirect behavior.",
        pa_024_b: "Bite the child back so they know how it feels.",
        pa_024_c: "Ignore it; it's just a phase all kids go through.",
        pa_024_d: "Scream at the biter until they cry.",

        pa_q_025: "Briefly explain how you respect the privacy of the families you work with (e.g., regarding social media, neighborhood gossip, and in-home observations).",

        pa_q_026: "If a child has a sudden, unexplained allergic reaction (hives, difficulty breathing) and no history of allergies, what is your FIRST step?",
        pa_026_a: "Call 911 immediately and then contact the parents.",
        pa_026_b: "Wait an hour to see if it goes away.",
        pa_026_c: "Give them random adult allergy medicine from my purse.",
        pa_026_d: "Take a picture and post it online asking what to do.",

        pa_q_027: "A child tells you that a family member makes them feel 'icky' when they are alone together. How do you respond?",
        pa_027_a: "Listen carefully without leading questions, reassure them they did the right thing by telling, and immediately report to authorities.",
        pa_027_b: "Tell them they are probably misunderstanding because family members love them.",
        pa_027_c: "Confront the family member directly to ask if it's true.",
        pa_027_d: "Ignore it to avoid getting involved in family drama.",

        pa_q_028: "Which of these is the most appropriate way to handle a potty-training accident?",
        pa_028_a: "Calmly reassure the child accidents happen, clean them up, and encourage trying again later.",
        pa_028_b: "Make a disgusted face and tell them they smell bad.",
        pa_028_c: "Punish them for ruining their clothes.",
        pa_028_d: "Leave them in wet clothes so they learn to use the toilet.",

        pa_q_029: "When sharing photos of a child on the FamLink app, what is the community standard?",
        pa_029_a: "Never post photos of a child without the explicit, written consent of their legal guardian.",
        pa_029_b: "Post whatever I want as long as the child looks happy.",
        pa_029_c: "Only share photos if I blur their face.",
        pa_029_d: "Share photos freely because FamLink is a closed community.",

        pa_q_030: "Describe a situation where you had to advocate for a child's needs when the adults around them were not listening."`;

const updatedContent = content.replace(/(pa_q_015:\s*"[^"]*")\r?\n(\s*})/g, '$1,\\n' + newQuestions + '\\n$2');

fs.writeFileSync('locales/parentAssessmentTranslations.ts', updatedContent);
console.log('Success, keys added.');
