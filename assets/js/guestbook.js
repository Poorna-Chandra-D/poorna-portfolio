// Guestbook Feature - Non-intrusive optional visitor capture
(function() {
    const GUESTBOOK_SHOWN_KEY = 'guestbook_shown_session';

    function showGuestbookModal() {
        // Check if already shown in this session
        if (sessionStorage.getItem(GUESTBOOK_SHOWN_KEY)) {
            return;
        }

        // Only show after 3 seconds (let them explore first)
        setTimeout(() => {
            // Create modal elements
            const modal = document.createElement('div');
            modal.id = 'guestbook-modal';
            modal.innerHTML = `
                <div class="guestbook-overlay"></div>
                <div class="guestbook-card">
                    <button class="guestbook-close" aria-label="Close">×</button>
                    <h3>Sign the Guestbook</h3>
                    <p>Leave your details (optional) - I'd love to know who visited!</p>
                    <form id="guestbook-form">
                        <input type="text" id="visitor-name" placeholder="Your name" maxlength="50">
                        <input type="email" id="visitor-email" placeholder="Email (optional)" maxlength="100">
                        <input type="url" id="visitor-linkedin" placeholder="LinkedIn profile (optional)" maxlength="200">
                        <button type="submit" class="guestbook-submit">Sign</button>
                        <button type="button" class="guestbook-skip">No thanks</button>
                    </form>
                </div>
            `;

            document.body.appendChild(modal);
            sessionStorage.setItem(GUESTBOOK_SHOWN_KEY, 'true');

            // Handle form submission
            const form = document.getElementById('guestbook-form');
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const visitorData = {
                    name: document.getElementById('visitor-name').value || null,
                    email: document.getElementById('visitor-email').value || null,
                    linkedIn: document.getElementById('visitor-linkedin').value || null
                };
                closeModal();
                
                // Store globally and trigger guestbook update notification
                window.guestbookData = visitorData;
                console.log('📋 Guestbook data captured:', visitorData);
                
                // Trigger custom event so visitor-tracker can send update
                window.dispatchEvent(new CustomEvent('guestbookSigned', { detail: visitorData }));
            });

            // Handle close button
            document.querySelector('.guestbook-close').addEventListener('click', closeModal);
            
            // Handle "No thanks" button
            document.querySelector('.guestbook-skip').addEventListener('click', closeModal);

            // Don't close on overlay click since it's transparent now
        }, 3000);
    }

    function closeModal() {
        const modal = document.getElementById('guestbook-modal');
        if (modal) {
            modal.classList.add('guestbook-closing');
            setTimeout(() => modal.remove(), 300);
        }
    }

    // Initialize when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', showGuestbookModal);
    } else {
        showGuestbookModal();
    }
})();
