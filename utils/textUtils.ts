
/**
 * Formats a category key into a human-readable string.
 * e.g. "activity_cat_playdates" -> "Playdates"
 * e.g. "Activity_cat_Tennis" -> "Tennis"
 * e.g. "cooking" -> "Cooking"
 */
export const formatCategoryName = (key: string): string => {
    if (!key) return '';

    // Remove prefixes if present
    let cleaned = key.replace(/^(activity_cat_|skill_cat_|Activity_cat_|Skill_cat_)/i, '');

    // Replace underscores/hyphens with spaces
    cleaned = cleaned.replace(/[_-]/g, ' ');

    // Title Case
    return cleaned.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

/**
 * Clean, formatted title for Activities.
 * e.g. "activity_cat_tennis" -> "Tennis"
 * e.g. "" -> "General Activity"
 */
export const formatActivityTitle = (key?: string): string => {
    if (!key) return 'General Activity';
    return formatCategoryName(key);
};

/**
 * Generates a human-readable fallback for a missing translation key.
 * e.g. "welcome_no_account" -> "Welcome No Account"
 */
export const formatKeyFallback = (key: string): string => {
    if (!key) return '';

    // Replace underscores/dots/hyphens with spaces
    let formatted = key.replace(/[._-]/g, ' ');

    // Capitalize first letter of each word
    return formatted.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

/**
 * Returns a consistent pastel background color based on the string.
 * Used for category tags.
 */
export const getCategoryColor = (category: string): string => {
    const colors = [
        'bg-blue-100 text-blue-700 border-blue-200',
        'bg-green-100 text-green-700 border-green-200',
        'bg-purple-100 text-purple-700 border-purple-200',
        'bg-pink-100 text-pink-700 border-pink-200',
        'bg-yellow-100 text-yellow-700 border-yellow-200',
        'bg-indigo-100 text-indigo-700 border-indigo-200',
        'bg-orange-100 text-orange-700 border-orange-200',
        'bg-teal-100 text-teal-700 border-teal-200',
    ];

    let hash = 0;
    for (let i = 0; i < category.length; i++) {
        hash = category.charCodeAt(i) + ((hash << 5) - hash);
    }

    const index = Math.abs(hash) % colors.length;
    return colors[index];
};
