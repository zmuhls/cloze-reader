// Initialize environment variables from meta tags
document.addEventListener('DOMContentLoaded', function() {
    const openrouterMeta = document.querySelector('meta[name="openrouter-key"]');
    const hfMeta = document.querySelector('meta[name="hf-key"]');
    
    if (openrouterMeta && openrouterMeta.content) {
        window.OPENROUTER_API_KEY = openrouterMeta.content;
    } else {
    }
    
    if (hfMeta && hfMeta.content) {
        window.HF_API_KEY = hfMeta.content;
    }
});