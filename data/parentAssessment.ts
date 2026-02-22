export const PARENT_ASSESSMENT_QUESTIONS: (t: (key: string) => string) => any[] = (t) => [
    // SECTION 1: EMOTIONAL REGULATION & STRESS 
    {
        id: 'pa_gen_001',
        type: 'multiple_choice',
        text: t('pa_q_001'),
        options: [
            { id: 'op_1a', text: t('pa_001_a') },
            { id: 'op_1b', text: t('pa_001_b') },
            { id: 'op_1c', text: t('pa_001_c') },
            { id: 'op_1d', text: t('pa_001_d') }
        ]
    },
    {
        id: 'pa_gen_002',
        type: 'multiple_choice',
        text: t('pa_q_002'),
        options: [
            { id: 'op_2a', text: t('pa_002_a') },
            { id: 'op_2b', text: t('pa_002_b') },
            { id: 'op_2c', text: t('pa_002_c') },
            { id: 'op_2d', text: t('pa_002_d') }
        ]
    },
    {
        id: 'pa_gen_003',
        type: 'multiple_choice',
        text: t('pa_q_003'),
        options: [
            { id: 'op_3a', text: t('pa_003_a') },
            { id: 'op_3b', text: t('pa_003_b') },
            { id: 'op_3c', text: t('pa_003_c') },
            { id: 'op_3d', text: t('pa_003_d') }
        ]
    },
    {
        id: 'pa_gen_004',
        type: 'multiple_answer',
        text: t('pa_q_004'),
        options: [
            { id: 'op_4a', text: t('pa_004_a') },
            { id: 'op_4b', text: t('pa_004_b') },
            { id: 'op_4c', text: t('pa_004_c') },
            { id: 'op_4d', text: t('pa_004_d') }
        ]
    },
    {
        id: 'pa_gen_005',
        type: 'text_input',
        text: t('pa_q_005')
    },

    // SECTION 2: COMMUNITY TRUST & BOUNDARIES
    {
        id: 'pa_gen_006',
        type: 'multiple_choice',
        text: t('pa_q_006'),
        options: [
            { id: 'op_6a', text: t('pa_006_a') },
            { id: 'op_6b', text: t('pa_006_b') },
            { id: 'op_6c', text: t('pa_006_c') },
            { id: 'op_6d', text: t('pa_006_d') }
        ]
    },
    {
        id: 'pa_gen_007',
        type: 'multiple_choice',
        text: t('pa_q_007'),
        options: [
            { id: 'op_7a', text: t('pa_007_a') },
            { id: 'op_7b', text: t('pa_007_b') },
            { id: 'op_7c', text: t('pa_007_c') },
            { id: 'op_7d', text: t('pa_007_d') }
        ]
    },
    {
        id: 'pa_gen_008',
        type: 'multiple_answer',
        text: t('pa_q_008'),
        options: [
            { id: 'op_8a', text: t('pa_008_a') },
            { id: 'op_8b', text: t('pa_008_b') },
            { id: 'op_8c', text: t('pa_008_c') },
            { id: 'op_8d', text: t('pa_008_d') }
        ]
    },
    {
        id: 'pa_gen_009',
        type: 'multiple_choice',
        text: t('pa_q_009'),
        options: [
            { id: 'op_9a', text: t('pa_009_a') },
            { id: 'op_9b', text: t('pa_009_b') },
            { id: 'op_9c', text: t('pa_009_c') },
            { id: 'op_9d', text: t('pa_009_d') }
        ]
    },
    {
        id: 'pa_gen_010',
        type: 'text_input',
        text: t('pa_q_010')
    },

    // SECTION 3: CHILD PROTECTION & EMERGENCY PROTOCOLS
    {
        id: 'pa_gen_011',
        type: 'multiple_choice',
        text: t('pa_q_011'),
        options: [
            { id: 'op_11a', text: t('pa_011_a') },
            { id: 'op_11b', text: t('pa_011_b') },
            { id: 'op_11c', text: t('pa_011_c') },
            { id: 'op_11d', text: t('pa_011_d') }
        ]
    },
    {
        id: 'pa_gen_012',
        type: 'multiple_answer',
        text: t('pa_q_012'),
        options: [
            { id: 'op_12a', text: t('pa_012_a') },
            { id: 'op_12b', text: t('pa_012_b') },
            { id: 'op_12c', text: t('pa_012_c') },
            { id: 'op_12d', text: t('pa_012_d') }
        ]
    },
    {
        id: 'pa_gen_013',
        type: 'multiple_choice',
        text: t('pa_q_013'),
        options: [
            { id: 'op_13a', text: t('pa_013_a') },
            { id: 'op_13b', text: t('pa_013_b') },
            { id: 'op_13c', text: t('pa_013_c') },
            { id: 'op_13d', text: t('pa_013_d') }
        ]
    },
    {
        id: 'pa_gen_014',
        type: 'multiple_choice',
        text: t('pa_q_014'),
        options: [
            { id: 'op_14a', text: t('pa_014_a') },
            { id: 'op_14b', text: t('pa_014_b') },
            { id: 'op_14c', text: t('pa_014_c') },
            { id: 'op_14d', text: t('pa_014_d') }
        ]
    },
    {
        id: 'pa_gen_015',
        type: 'text_input',
        text: t('pa_q_015')
    },
    // SECTION 4: ADVANCED SAFETY & BOUNDARIES
    {
        id: 'pa_gen_016',
        type: 'multiple_choice',
        text: t('pa_q_016'),
        options: [
            { id: 'op_16a', text: t('pa_016_a') },
            { id: 'op_16b', text: t('pa_016_b') },
            { id: 'op_16c', text: t('pa_016_c') },
            { id: 'op_16d', text: t('pa_016_d') }
        ]
    },
    {
        id: 'pa_gen_017',
        type: 'multiple_choice',
        text: t('pa_q_017'),
        options: [
            { id: 'op_17a', text: t('pa_017_a') },
            { id: 'op_17b', text: t('pa_017_b') },
            { id: 'op_17c', text: t('pa_017_c') },
            { id: 'op_17d', text: t('pa_017_d') }
        ]
    },
    {
        id: 'pa_gen_018',
        type: 'multiple_choice',
        text: t('pa_q_018'),
        options: [
            { id: 'op_18a', text: t('pa_018_a') },
            { id: 'op_18b', text: t('pa_018_b') },
            { id: 'op_18c', text: t('pa_018_c') },
            { id: 'op_18d', text: t('pa_018_d') }
        ]
    },
    {
        id: 'pa_gen_019',
        type: 'multiple_choice',
        text: t('pa_q_019'),
        options: [
            { id: 'op_19a', text: t('pa_019_a') },
            { id: 'op_19b', text: t('pa_019_b') },
            { id: 'op_19c', text: t('pa_019_c') },
            { id: 'op_19d', text: t('pa_019_d') }
        ]
    },
    {
        id: 'pa_gen_020',
        type: 'multiple_choice',
        text: t('pa_q_020'),
        options: [
            { id: 'op_20a', text: t('pa_020_a') },
            { id: 'op_20b', text: t('pa_020_b') },
            { id: 'op_20c', text: t('pa_020_c') },
            { id: 'op_20d', text: t('pa_020_d') }
        ]
    },

    // SECTION 5: COMPLEX SCENARIOS & ABUSE PREVENTION
    {
        id: 'pa_gen_021',
        type: 'multiple_choice',
        text: t('pa_q_021'),
        options: [
            { id: 'op_21a', text: t('pa_021_a') },
            { id: 'op_21b', text: t('pa_021_b') },
            { id: 'op_21c', text: t('pa_021_c') },
            { id: 'op_21d', text: t('pa_021_d') }
        ]
    },
    {
        id: 'pa_gen_022',
        type: 'multiple_answer',
        text: t('pa_q_022'),
        options: [
            { id: 'op_22a', text: t('pa_022_a') },
            { id: 'op_22b', text: t('pa_022_b') },
            { id: 'op_22c', text: t('pa_022_c') },
            { id: 'op_22d', text: t('pa_022_d') }
        ]
    },
    {
        id: 'pa_gen_023',
        type: 'multiple_choice',
        text: t('pa_q_023'),
        options: [
            { id: 'op_23a', text: t('pa_023_a') },
            { id: 'op_23b', text: t('pa_023_b') },
            { id: 'op_23c', text: t('pa_023_c') },
            { id: 'op_23d', text: t('pa_023_d') }
        ]
    },
    {
        id: 'pa_gen_024',
        type: 'multiple_choice',
        text: t('pa_q_024'),
        options: [
            { id: 'op_24a', text: t('pa_024_a') },
            { id: 'op_24b', text: t('pa_024_b') },
            { id: 'op_24c', text: t('pa_024_c') },
            { id: 'op_24d', text: t('pa_024_d') }
        ]
    },
    {
        id: 'pa_gen_025',
        type: 'text_input',
        text: t('pa_q_025')
    },

    // SECTION 6: ETHICS & EXTREME EMERGENCIES
    {
        id: 'pa_gen_026',
        type: 'multiple_choice',
        text: t('pa_q_026'),
        options: [
            { id: 'op_26a', text: t('pa_026_a') },
            { id: 'op_26b', text: t('pa_026_b') },
            { id: 'op_26c', text: t('pa_026_c') },
            { id: 'op_26d', text: t('pa_026_d') }
        ]
    },
    {
        id: 'pa_gen_027',
        type: 'multiple_choice',
        text: t('pa_q_027'),
        options: [
            { id: 'op_27a', text: t('pa_027_a') },
            { id: 'op_27b', text: t('pa_027_b') },
            { id: 'op_27c', text: t('pa_027_c') },
            { id: 'op_27d', text: t('pa_027_d') }
        ]
    },
    {
        id: 'pa_gen_028',
        type: 'multiple_choice',
        text: t('pa_q_028'),
        options: [
            { id: 'op_28a', text: t('pa_028_a') },
            { id: 'op_28b', text: t('pa_028_b') },
            { id: 'op_28c', text: t('pa_028_c') },
            { id: 'op_28d', text: t('pa_028_d') }
        ]
    },
    {
        id: 'pa_gen_029',
        type: 'multiple_choice',
        text: t('pa_q_029'),
        options: [
            { id: 'op_29a', text: t('pa_029_a') },
            { id: 'op_29b', text: t('pa_029_b') },
            { id: 'op_29c', text: t('pa_029_c') },
            { id: 'op_29d', text: t('pa_029_d') }
        ]
    },
    {
        id: 'pa_gen_030',
        type: 'text_input',
        text: t('pa_q_030')
    },
    // SECTION 7: DIGITAL SAFETY & SCREEN TIME
    {
        id: 'pa_gen_031',
        type: 'multiple_choice',
        text: t('pa_q_031'),
        options: [
            { id: 'op_31a', text: t('pa_031_a') },
            { id: 'op_31b', text: t('pa_031_b') },
            { id: 'op_31c', text: t('pa_031_c') },
            { id: 'op_31d', text: t('pa_031_d') }
        ]
    },
    {
        id: 'pa_gen_032',
        type: 'multiple_choice',
        text: t('pa_q_032'),
        options: [
            { id: 'op_32a', text: t('pa_032_a') },
            { id: 'op_32b', text: t('pa_032_b') },
            { id: 'op_32c', text: t('pa_032_c') },
            { id: 'op_32d', text: t('pa_032_d') }
        ]
    },
    {
        id: 'pa_gen_033',
        type: 'multiple_answer',
        text: t('pa_q_033'),
        options: [
            { id: 'op_33a', text: t('pa_033_a') },
            { id: 'op_33b', text: t('pa_033_b') },
            { id: 'op_33c', text: t('pa_033_c') },
            { id: 'op_33d', text: t('pa_033_d') }
        ]
    },
    {
        id: 'pa_gen_034',
        type: 'multiple_choice',
        text: t('pa_q_034'),
        options: [
            { id: 'op_34a', text: t('pa_034_a') },
            { id: 'op_34b', text: t('pa_034_b') },
            { id: 'op_34c', text: t('pa_034_c') },
            { id: 'op_34d', text: t('pa_034_d') }
        ]
    },
    {
        id: 'pa_gen_035',
        type: 'text_input',
        text: t('pa_q_035')
    },
    // SECTION 8: NEURODIVERGENCE & INCLUSION
    {
        id: 'pa_gen_036',
        type: 'multiple_choice',
        text: t('pa_q_036'),
        options: [
            { id: 'op_36a', text: t('pa_036_a') },
            { id: 'op_36b', text: t('pa_036_b') },
            { id: 'op_36c', text: t('pa_036_c') },
            { id: 'op_36d', text: t('pa_036_d') }
        ]
    },
    {
        id: 'pa_gen_037',
        type: 'multiple_choice',
        text: t('pa_q_037'),
        options: [
            { id: 'op_37a', text: t('pa_037_a') },
            { id: 'op_37b', text: t('pa_037_b') },
            { id: 'op_37c', text: t('pa_037_c') },
            { id: 'op_37d', text: t('pa_037_d') }
        ]
    },
    {
        id: 'pa_gen_038',
        type: 'multiple_answer',
        text: t('pa_q_038'),
        options: [
            { id: 'op_38a', text: t('pa_038_a') },
            { id: 'op_38b', text: t('pa_038_b') },
            { id: 'op_38c', text: t('pa_038_c') },
            { id: 'op_38d', text: t('pa_038_d') }
        ]
    },
    {
        id: 'pa_gen_039',
        type: 'multiple_choice',
        text: t('pa_q_039'),
        options: [
            { id: 'op_39a', text: t('pa_039_a') },
            { id: 'op_39b', text: t('pa_039_b') },
            { id: 'op_39c', text: t('pa_039_c') },
            { id: 'op_39d', text: t('pa_039_d') }
        ]
    },
    {
        id: 'pa_gen_040',
        type: 'text_input',
        text: t('pa_q_040')
    },
    // SECTION 9: DISCIPLINE & CONFLICT RESOLUTION
    {
        id: 'pa_gen_041',
        type: 'multiple_choice',
        text: t('pa_q_041'),
        options: [
            { id: 'op_41a', text: t('pa_041_a') },
            { id: 'op_41b', text: t('pa_041_b') },
            { id: 'op_41c', text: t('pa_041_c') },
            { id: 'op_41d', text: t('pa_041_d') }
        ]
    },
    {
        id: 'pa_gen_042',
        type: 'multiple_choice',
        text: t('pa_q_042'),
        options: [
            { id: 'op_42a', text: t('pa_042_a') },
            { id: 'op_42b', text: t('pa_042_b') },
            { id: 'op_42c', text: t('pa_042_c') },
            { id: 'op_42d', text: t('pa_042_d') }
        ]
    },
    {
        id: 'pa_gen_043',
        type: 'multiple_choice',
        text: t('pa_q_043'),
        options: [
            { id: 'op_43a', text: t('pa_043_a') },
            { id: 'op_43b', text: t('pa_043_b') },
            { id: 'op_43c', text: t('pa_043_c') },
            { id: 'op_43d', text: t('pa_043_d') }
        ]
    },
    {
        id: 'pa_gen_044',
        type: 'multiple_answer',
        text: t('pa_q_044'),
        options: [
            { id: 'op_44a', text: t('pa_044_a') },
            { id: 'op_44b', text: t('pa_044_b') },
            { id: 'op_44c', text: t('pa_044_c') },
            { id: 'op_44d', text: t('pa_044_d') }
        ]
    },
    {
        id: 'pa_gen_045',
        type: 'text_input',
        text: t('pa_q_045')
    },
    // SECTION 10: CO-PARENTING & FAMILY DYNAMICS
    {
        id: 'pa_gen_046',
        type: 'multiple_choice',
        text: t('pa_q_046'),
        options: [
            { id: 'op_46a', text: t('pa_046_a') },
            { id: 'op_46b', text: t('pa_046_b') },
            { id: 'op_46c', text: t('pa_046_c') },
            { id: 'op_46d', text: t('pa_046_d') }
        ]
    },
    {
        id: 'pa_gen_047',
        type: 'multiple_choice',
        text: t('pa_q_047'),
        options: [
            { id: 'op_47a', text: t('pa_047_a') },
            { id: 'op_47b', text: t('pa_047_b') },
            { id: 'op_47c', text: t('pa_047_c') },
            { id: 'op_47d', text: t('pa_047_d') }
        ]
    },
    {
        id: 'pa_gen_048',
        type: 'multiple_choice',
        text: t('pa_q_048'),
        options: [
            { id: 'op_48a', text: t('pa_048_a') },
            { id: 'op_48b', text: t('pa_048_b') },
            { id: 'op_48c', text: t('pa_048_c') },
            { id: 'op_48d', text: t('pa_048_d') }
        ]
    },
    {
        id: 'pa_gen_049',
        type: 'multiple_answer',
        text: t('pa_q_049'),
        options: [
            { id: 'op_49a', text: t('pa_049_a') },
            { id: 'op_49b', text: t('pa_049_b') },
            { id: 'op_49c', text: t('pa_049_c') },
            { id: 'op_49d', text: t('pa_049_d') }
        ]
    },
    {
        id: 'pa_gen_050',
        type: 'text_input',
        text: t('pa_q_050')
    },
    // SECTION 11: MENTAL HEALTH AWARENESS
    {
        id: 'pa_gen_051',
        type: 'multiple_choice',
        text: t('pa_q_051'),
        options: [
            { id: 'op_51a', text: t('pa_051_a') },
            { id: 'op_51b', text: t('pa_051_b') },
            { id: 'op_51c', text: t('pa_051_c') },
            { id: 'op_51d', text: t('pa_051_d') }
        ]
    },
    {
        id: 'pa_gen_052',
        type: 'multiple_choice',
        text: t('pa_q_052'),
        options: [
            { id: 'op_52a', text: t('pa_052_a') },
            { id: 'op_52b', text: t('pa_052_b') },
            { id: 'op_52c', text: t('pa_052_c') },
            { id: 'op_52d', text: t('pa_052_d') }
        ]
    },
    {
        id: 'pa_gen_053',
        type: 'multiple_choice',
        text: t('pa_q_053'),
        options: [
            { id: 'op_53a', text: t('pa_053_a') },
            { id: 'op_53b', text: t('pa_053_b') },
            { id: 'op_53c', text: t('pa_053_c') },
            { id: 'op_53d', text: t('pa_053_d') }
        ]
    },
    {
        id: 'pa_gen_054',
        type: 'multiple_answer',
        text: t('pa_q_054'),
        options: [
            { id: 'op_54a', text: t('pa_054_a') },
            { id: 'op_54b', text: t('pa_054_b') },
            { id: 'op_54c', text: t('pa_054_c') },
            { id: 'op_54d', text: t('pa_054_d') }
        ]
    },
    {
        id: 'pa_gen_055',
        type: 'text_input',
        text: t('pa_q_055')
    },
    // SECTION 12: CULTURAL COMPETENCY & DIVERSITY
    {
        id: 'pa_gen_056',
        type: 'multiple_choice',
        text: t('pa_q_056'),
        options: [
            { id: 'op_56a', text: t('pa_056_a') },
            { id: 'op_56b', text: t('pa_056_b') },
            { id: 'op_56c', text: t('pa_056_c') },
            { id: 'op_56d', text: t('pa_056_d') }
        ]
    },
    {
        id: 'pa_gen_057',
        type: 'multiple_choice',
        text: t('pa_q_057'),
        options: [
            { id: 'op_57a', text: t('pa_057_a') },
            { id: 'op_57b', text: t('pa_057_b') },
            { id: 'op_57c', text: t('pa_057_c') },
            { id: 'op_57d', text: t('pa_057_d') }
        ]
    },
    {
        id: 'pa_gen_058',
        type: 'multiple_choice',
        text: t('pa_q_058'),
        options: [
            { id: 'op_58a', text: t('pa_058_a') },
            { id: 'op_58b', text: t('pa_058_b') },
            { id: 'op_58c', text: t('pa_058_c') },
            { id: 'op_58d', text: t('pa_058_d') }
        ]
    },
    {
        id: 'pa_gen_059',
        type: 'multiple_answer',
        text: t('pa_q_059'),
        options: [
            { id: 'op_59a', text: t('pa_059_a') },
            { id: 'op_59b', text: t('pa_059_b') },
            { id: 'op_59c', text: t('pa_059_c') },
            { id: 'op_59d', text: t('pa_059_d') }
        ]
    },
    {
        id: 'pa_gen_060',
        type: 'text_input',
        text: t('pa_q_060')
    },
    // SECTION 13: NUTRITION & PHYSICAL WELLBEING
    {
        id: 'pa_gen_061',
        type: 'multiple_choice',
        text: t('pa_q_061'),
        options: [
            { id: 'op_61a', text: t('pa_061_a') },
            { id: 'op_61b', text: t('pa_061_b') },
            { id: 'op_61c', text: t('pa_061_c') },
            { id: 'op_61d', text: t('pa_061_d') }
        ]
    },
    {
        id: 'pa_gen_062',
        type: 'multiple_choice',
        text: t('pa_q_062'),
        options: [
            { id: 'op_62a', text: t('pa_062_a') },
            { id: 'op_62b', text: t('pa_062_b') },
            { id: 'op_62c', text: t('pa_062_c') },
            { id: 'op_62d', text: t('pa_062_d') }
        ]
    },
    {
        id: 'pa_gen_063',
        type: 'multiple_choice',
        text: t('pa_q_063'),
        options: [
            { id: 'op_63a', text: t('pa_063_a') },
            { id: 'op_63b', text: t('pa_063_b') },
            { id: 'op_63c', text: t('pa_063_c') },
            { id: 'op_63d', text: t('pa_063_d') }
        ]
    },
    {
        id: 'pa_gen_064',
        type: 'multiple_answer',
        text: t('pa_q_064'),
        options: [
            { id: 'op_64a', text: t('pa_064_a') },
            { id: 'op_64b', text: t('pa_064_b') },
            { id: 'op_64c', text: t('pa_064_c') },
            { id: 'op_64d', text: t('pa_064_d') }
        ]
    },
    {
        id: 'pa_gen_065',
        type: 'text_input',
        text: t('pa_q_065')
    },
    // SECTION 14: EDUCATION & DEVELOPMENTAL MILESTONES
    {
        id: 'pa_gen_066',
        type: 'multiple_choice',
        text: t('pa_q_066'),
        options: [
            { id: 'op_66a', text: t('pa_066_a') },
            { id: 'op_66b', text: t('pa_066_b') },
            { id: 'op_66c', text: t('pa_066_c') },
            { id: 'op_66d', text: t('pa_066_d') }
        ]
    },
    {
        id: 'pa_gen_067',
        type: 'multiple_choice',
        text: t('pa_q_067'),
        options: [
            { id: 'op_67a', text: t('pa_067_a') },
            { id: 'op_67b', text: t('pa_067_b') },
            { id: 'op_67c', text: t('pa_067_c') },
            { id: 'op_67d', text: t('pa_067_d') }
        ]
    },
    {
        id: 'pa_gen_068',
        type: 'multiple_choice',
        text: t('pa_q_068'),
        options: [
            { id: 'op_68a', text: t('pa_068_a') },
            { id: 'op_68b', text: t('pa_068_b') },
            { id: 'op_68c', text: t('pa_068_c') },
            { id: 'op_68d', text: t('pa_068_d') }
        ]
    },
    {
        id: 'pa_gen_069',
        type: 'multiple_answer',
        text: t('pa_q_069'),
        options: [
            { id: 'op_69a', text: t('pa_069_a') },
            { id: 'op_69b', text: t('pa_069_b') },
            { id: 'op_69c', text: t('pa_069_c') },
            { id: 'op_69d', text: t('pa_069_d') }
        ]
    },
    {
        id: 'pa_gen_070',
        type: 'text_input',
        text: t('pa_q_070')
    },
    // SECTION 15: ADVANCED ETHICAL DILEMMAS
    {
        id: 'pa_gen_071',
        type: 'multiple_choice',
        text: t('pa_q_071'),
        options: [
            { id: 'op_71a', text: t('pa_071_a') },
            { id: 'op_71b', text: t('pa_071_b') },
            { id: 'op_71c', text: t('pa_071_c') },
            { id: 'op_71d', text: t('pa_071_d') }
        ]
    },
    {
        id: 'pa_gen_072',
        type: 'multiple_choice',
        text: t('pa_q_072'),
        options: [
            { id: 'op_72a', text: t('pa_072_a') },
            { id: 'op_72b', text: t('pa_072_b') },
            { id: 'op_72c', text: t('pa_072_c') },
            { id: 'op_72d', text: t('pa_072_d') }
        ]
    },
    {
        id: 'pa_gen_073',
        type: 'multiple_choice',
        text: t('pa_q_073'),
        options: [
            { id: 'op_73a', text: t('pa_073_a') },
            { id: 'op_73b', text: t('pa_073_b') },
            { id: 'op_73c', text: t('pa_073_c') },
            { id: 'op_73d', text: t('pa_073_d') }
        ]
    },
    {
        id: 'pa_gen_074',
        type: 'multiple_choice',
        text: t('pa_q_074'),
        options: [
            { id: 'op_74a', text: t('pa_074_a') },
            { id: 'op_74b', text: t('pa_074_b') },
            { id: 'op_74c', text: t('pa_074_c') },
            { id: 'op_74d', text: t('pa_074_d') }
        ]
    },
    {
        id: 'pa_gen_075',
        type: 'text_input',
        text: t('pa_q_075')
    },
    // SECTION 16: COMMUNITY RESPONSIBILITY & LEADERSHIP
    {
        id: 'pa_gen_076',
        type: 'multiple_choice',
        text: t('pa_q_076'),
        options: [
            { id: 'op_76a', text: t('pa_076_a') },
            { id: 'op_76b', text: t('pa_076_b') },
            { id: 'op_76c', text: t('pa_076_c') },
            { id: 'op_76d', text: t('pa_076_d') }
        ]
    },
    {
        id: 'pa_gen_077',
        type: 'multiple_choice',
        text: t('pa_q_077'),
        options: [
            { id: 'op_77a', text: t('pa_077_a') },
            { id: 'op_77b', text: t('pa_077_b') },
            { id: 'op_77c', text: t('pa_077_c') },
            { id: 'op_77d', text: t('pa_077_d') }
        ]
    },
    {
        id: 'pa_gen_078',
        type: 'multiple_answer',
        text: t('pa_q_078'),
        options: [
            { id: 'op_78a', text: t('pa_078_a') },
            { id: 'op_78b', text: t('pa_078_b') },
            { id: 'op_78c', text: t('pa_078_c') },
            { id: 'op_78d', text: t('pa_078_d') }
        ]
    },
    {
        id: 'pa_gen_079',
        type: 'multiple_choice',
        text: t('pa_q_079'),
        options: [
            { id: 'op_79a', text: t('pa_079_a') },
            { id: 'op_79b', text: t('pa_079_b') },
            { id: 'op_79c', text: t('pa_079_c') },
            { id: 'op_79d', text: t('pa_079_d') }
        ]
    },
    {
        id: 'pa_gen_080',
        type: 'text_input',
        text: t('pa_q_080')
    }
];

// Helper to securely generate 25 random IDs from the 80-question bank
export const getRandomParentQuestionIds = (count: number = 25): string[] => {
    const ids = Array.from({ length: 80 }, (_, i) => `pa_gen_${(i + 1).toString().padStart(3, '0')}`);
    // Fisher-Yates shuffle
    for (let i = ids.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    return ids.slice(0, Math.min(count, ids.length));
};

// Returns the actual 80-question bank with the current translation context
export const getParentAssessmentQuestionsBank = (t: (key: string) => string): any[] => {
    return PARENT_ASSESSMENT_QUESTIONS(t);
};

