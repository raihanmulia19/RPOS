import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: "class",
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            colors: {
                "on-surface": "#1d1b19", "background": "#fef8f4", "surface-variant": "#e7e1de", "secondary-fixed-dim": "#ffb877", "on-primary-fixed-variant": "#5b403c", "tertiary-fixed-dim": "#e7bdb1", "tertiary-container": "#40261e", "error-container": "#ffdad6", "on-error-container": "#93000a", "on-tertiary-fixed-variant": "#5d4037", "on-background": "#1d1b19", "inverse-primary": "#e3beb8", "on-tertiary-container": "#b18c81", "tertiary-fixed": "#ffdbd0", "primary": "#271310", "error": "#ba1a1a", "outline-variant": "#d3c3c0", "on-secondary-fixed-variant": "#6c3a00", "on-primary-fixed": "#2b1613", "on-surface-variant": "#504442", "secondary": "#8d4f03", "surface-container-high": "#ede7e3", "surface-container-lowest": "#ffffff", "on-secondary-container": "#744000", "on-primary-container": "#ae8d87", "surface": "#fef8f4", "primary-container": "#3e2723", "on-tertiary-fixed": "#2c160e", "on-primary": "#ffffff", "tertiary": "#28120b", "on-secondary": "#ffffff", "inverse-surface": "#32302e", "on-tertiary": "#ffffff", "surface-tint": "#745853", "surface-container": "#f3ede9", "surface-dim": "#dfd9d5", "secondary-fixed": "#ffdcc1", "outline": "#827472", "on-secondary-fixed": "#2e1600", "surface-container-highest": "#e7e1de", "on-error": "#ffffff", "inverse-on-surface": "#f6f0ec", "surface-bright": "#fef8f4", "surface-container-low": "#f9f2ef", "secondary-container": "#feac5f", "primary-fixed-dim": "#e3beb8", "primary-fixed": "#ffdad4"
            },
            borderRadius: { "DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px" },
            spacing: { "space-xl": "2rem", "gutter-tablet": "0.75rem", "gutter": "1rem", "space-sm": "0.5rem", "space-lg": "1.5rem", "space-md": "1rem", "space-xs": "0.25rem", "margin": "1.5rem", "margin-compact": "1rem" },
            fontFamily: {
                "sans": ["Plus Jakarta Sans", ...defaultTheme.fontFamily.sans],
                "headline-md": ["Space Grotesk"], "label-lg": ["Plus Jakarta Sans"], "body-md": ["Plus Jakarta Sans"], "body-lg": ["Plus Jakarta Sans"], "body-sm": ["Plus Jakarta Sans"], "label-numeric-lg": ["Space Grotesk"], "label-md": ["Plus Jakarta Sans"], "display-md": ["Space Grotesk"], "headline-sm": ["Space Grotesk"], "display-lg": ["Space Grotesk"], "headline-lg": ["Space Grotesk"], "label-sm": ["Plus Jakarta Sans"]
            },
            fontSize: { "headline-md": ["1.375rem", { "lineHeight": "1.75rem", "fontWeight": "600" }], "label-lg": ["1rem", { "lineHeight": "1.25rem", "letterSpacing": "0.01em", "fontWeight": "600" }], "body-md": ["1rem", { "lineHeight": "1.5rem", "fontWeight": "400" }], "body-lg": ["1.125rem", { "lineHeight": "1.625rem", "fontWeight": "500" }], "body-sm": ["0.875rem", { "lineHeight": "1.25rem", "fontWeight": "400" }], "label-numeric-lg": ["1.875rem", { "lineHeight": "2.25rem", "letterSpacing": "-0.02em", "fontWeight": "700" }], "label-md": ["0.875rem", { "lineHeight": "1.125rem", "fontWeight": "600" }], "display-md": ["2.25rem", { "lineHeight": "2.75rem", "letterSpacing": "-0.02em", "fontWeight": "700" }], "headline-sm": ["1.125rem", { "lineHeight": "1.5rem", "fontWeight": "600" }], "display-lg": ["3rem", { "lineHeight": "3.5rem", "letterSpacing": "-0.03em", "fontWeight": "700" }], "headline-lg": ["1.75rem", { "lineHeight": "2.25rem", "letterSpacing": "-0.015em", "fontWeight": "600" }], "label-sm": ["0.75rem", { "lineHeight": "1rem", "letterSpacing": "0.04em", "fontWeight": "700" }] }
        },
    },

    plugins: [forms],
};
