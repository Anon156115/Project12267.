document.addEventListener('DOMContentLoaded', () => {
    // --- Element Selection ---
    const movieCards = document.querySelectorAll('.movie-card');
    const currentPoster = document.getElementById('current-poster');
    const currentMovieTitle = document.getElementById('current-movie-title');
    const branchSelect = document.getElementById('branch');
    const dateInput = document.getElementById('show-date');
    const timeButtonsContainer = document.querySelector('.showtimes');
    const seatingSection = document.getElementById('seating-section');
    const summarySection = document.getElementById('summary-section');
    const seatsContainer = document.querySelector('.seats');
    const summaryMovieSpan = document.getElementById('summary-movie');
    const summaryBranchSpan = document.getElementById('summary-branch');
    const summaryDateSpan = document.getElementById('summary-date');
    const summaryTimeSpan = document.getElementById('summary-time');
    const selectedSeatsSpan = document.getElementById('summary-seats');
    const seatCountSpan = document.getElementById('summary-count');
    const totalPriceSpan = document.getElementById('summary-price'); // Overall total price
    const confirmBtn = document.getElementById('confirm-btn');
    const countdownTimerSpan = document.getElementById('timer');
    const loadingOverlay = document.getElementById('loading-overlay');
    const modal = document.getElementById('confirmation-modal'); // Confirmation modal
    const closeModalButtons = modal?.querySelectorAll('.close-button'); // Includes footer button
    const modalSummaryDiv = document.getElementById('modal-summary');
    const step1 = document.getElementById('step-1');
    const step2 = document.getElementById('step-2');
    const step3 = document.getElementById('step-3');
    const currentYearSpan = document.getElementById('current-year');

    // Trailer Modal Elements
    const trailerButtons = document.querySelectorAll('.btn-trailer');
    const trailerModal = document.getElementById('trailer-modal');
    const trailerModalCloseBtn = trailerModal?.querySelector('.trailer-close-button');
    const youtubePlayerContainer = document.getElementById('youtube-player-container');

    // F&B Elements
    const fbSection = document.getElementById('fb-section');
    const fbItemsGrid = document.querySelector('.fb-items-grid');
    const fbSubtotalPriceSpan = document.getElementById('fb-subtotal-price');
    const summaryFbItemsSpan = document.getElementById('summary-fb-items');
    const summaryFbPriceSpan = document.getElementById('summary-fb-price');

    // --- NEW: Navigation and Section Elements ---
    const navLinkMovies = document.getElementById('nav-link-movies');
    const navLinkBranches = document.getElementById('nav-link-branches');
    const navLinkPromotions = document.getElementById('nav-link-promotions');
    const allNavLinks = document.querySelectorAll('header nav .nav-link:not(.login-link)'); // Select non-login nav links

    const bookingFlowSection = document.getElementById('booking-flow-section');
    const branchInfoSection = document.getElementById('branch-info-section');
    const promotionSection = document.getElementById('promotion-section');
    const allMainSections = [bookingFlowSection, branchInfoSection, promotionSection]; // Array of main switchable sections

    const progressSection = document.querySelector('.progress-section'); // Select progress bar section

    // --- State Variables ---
    let selectedMovie = { // Initial default selection based on 'active' card
        id: document.querySelector('.movie-card.active')?.dataset.movieId || 'lahnmah',
        title: document.querySelector('.movie-card.active')?.dataset.movieTitle || 'หลานม่า',
        poster: document.querySelector('.movie-card.active')?.querySelector('img')?.src || 'https://img2.pic.in.th/pic/thumb_3972.jpg'
    };
    let selectedBranch = branchSelect?.value;
    let selectedDate = dateInput?.value;
    let selectedTime = null;
    let selectedSeats = []; // Array of objects: { id: 'A1', price: 250 }
    let selectedFbItems = {}; // Object for F&B: { 'itemId': { quantity: N, price: P, name: '...' } }
    let countdownInterval = null;
    let timerSeconds = 600; // 10 minutes
    const FADE_DURATION = 300; // Match CSS transition speed in ms

    // --- Initial Setup ---
    if (currentYearSpan) currentYearSpan.textContent = new Date().getFullYear();
    const today = new Date().toISOString().split('T')[0];
    if (dateInput) {
        dateInput.value = today;
        selectedDate = today;
        dateInput.min = today;
    } else {
        selectedDate = today; // Fallback
    }

    updateSelectedMovieDetails(selectedMovie);
    updateSummaryDisplay();
    // updateProgressSteps(1); // Called within showSection now
    showSection('booking-flow-section'); // Show booking flow by default

    // --- Event Listeners ---

    // Movie Selection (MODIFIED)
    movieCards.forEach(card => {
        card.addEventListener('click', () => {
            // First, ensure the booking flow section is visible
            showSection('booking-flow-section'); // Switch view if needed

            // Then, proceed with movie selection logic
            movieCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');

            selectedMovie = {
                id: card.dataset.movieId,
                title: card.dataset.movieTitle,
                poster: card.querySelector('img').src
                // youtubeId: card.dataset.youtubeId // Add if needed later
            };

            updateSelectedMovieDetails(selectedMovie);
            resetAllSelections(); // Reset time, seats, F&B
            hideSeatAndSummary(() => { // Hide seating/summary *within* booking flow
                updateProgressSteps(1); // Reset progress *within* booking flow
                // Scroll to booking details after selection (optional)
                const bookingDetailsElement = document.querySelector('.booking-details');
                 if(bookingDetailsElement) {
                     bookingDetailsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                 }
            });
        });
    });

    // Branch Selection
    if (branchSelect) {
        branchSelect.addEventListener('change', (event) => {
            selectedBranch = event.target.value;
            updateSummaryDisplay(); // Update summary
        });
    }

    // Date Selection
    if (dateInput) {
        dateInput.addEventListener('change', (event) => {
            selectedDate = event.target.value;
            resetTimeSelection(); // Only reset time, seats, F&B reset on time select
            hideSeatAndSummary(() => {
                updateProgressSteps(1); // Back to step 1 visuals if seats/summary were visible
            });
            // No need to call updateSummaryDisplay here as resetTimeSelection doesn't change summary directly
        });
    }

    // Time Selection
    if (timeButtonsContainer) {
        timeButtonsContainer.addEventListener('click', (event) => {
            if (event.target.classList.contains('time-btn')) {
                const currentSelected = timeButtonsContainer.querySelector('.selected-time');
                if (currentSelected) {
                    currentSelected.classList.remove('selected-time');
                }

                event.target.classList.add('selected-time');
                selectedTime = event.target.dataset.time;

                // Reset seats (F&B persists unless explicitly reset elsewhere)
                seatsContainer?.querySelectorAll('.seat.selected').forEach(seat => seat.classList.remove('selected'));
                selectedSeats = [];
                updateSummaryDisplay(); // Update summary (time selected, seats=0, existing F&B)

                showLoading();
                // Simulate fetching seat availability
                setTimeout(() => {
                    hideLoading();
                    showSeatAndSummary(); // Show seating, F&B, and summary sections *within* booking flow
                    updateProgressSteps(2); // Move to Step 2 (Seats & F&B)
                    if(seatingSection) {
                        seatingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }, 800); // Simulate network delay
            }
        });
    }

    // Seat Selection
    if (seatsContainer) {
        seatsContainer.addEventListener('click', (event) => {
            const seatElement = event.target.closest('.seat');
            if (seatElement && !seatElement.classList.contains('occupied')) {
                const seatId = seatElement.dataset.seat;
                const seatPrice = parseInt(seatElement.dataset.price) || 0;

                seatElement.classList.toggle('selected');

                if (seatElement.classList.contains('selected')) {
                    selectedSeats.push({ id: seatId, price: seatPrice });
                } else {
                    selectedSeats = selectedSeats.filter(seat => seat.id !== seatId);
                }
                updateSummaryDisplay(); // Update summary with new seat price
                resetCountdown(); // Reset timer on interaction
            }
        });
    }

    // Food & Beverage Quantity Buttons
    if (fbItemsGrid) {
        fbItemsGrid.addEventListener('click', (event) => {
            const target = event.target;
            const itemCard = target.closest('.fb-item-card');
            if (!itemCard) return;

            const itemId = itemCard.dataset.fbId;
            const itemName = itemCard.dataset.fbName;
            const itemPrice = parseInt(itemCard.dataset.fbPrice) || 0;
            const quantityDisplay = itemCard.querySelector('.quantity-display');
            let currentQuantity = selectedFbItems[itemId] ? selectedFbItems[itemId].quantity : 0;
            const MAX_QUANTITY = 10;

            if (target.classList.contains('plus')) {
                if (currentQuantity < MAX_QUANTITY) currentQuantity++;
            } else if (target.classList.contains('minus')) {
                if (currentQuantity > 0) currentQuantity--;
            } else {
                 return; // Ignore other clicks
            }

            // Update state object
            if (currentQuantity > 0) {
                selectedFbItems[itemId] = { quantity: currentQuantity, price: itemPrice, name: itemName };
            } else {
                delete selectedFbItems[itemId]; // Remove if quantity is 0
            }

            // Update UI
            if (quantityDisplay) quantityDisplay.textContent = currentQuantity;
            updateFbSubtotal();
            updateSummaryDisplay(); // Update main summary (including overall total)
            resetCountdown();
        });
    }

    // Confirm Button (MODIFIED)
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            // Ensure we are in the booking flow
            if (bookingFlowSection && bookingFlowSection.classList.contains('hidden')) {
                console.warn("Attempted to confirm booking while not on the booking screen.");
                return;
            }

            if (selectedSeats.length === 0) {
                alert('กรุณาเลือกที่นั่งก่อนทำการยืนยัน');
                return;
            }
            if (!selectedTime) {
                 alert('เกิดข้อผิดพลาด: ไม่ได้เลือกรอบฉาย');
                return;
            }
            clearInterval(countdownInterval);
            updateProgressSteps(3); // Update progress step visual
            // ** TODO: Send booking data (selectedMovie, selectedBranch, selectedDate, selectedTime, selectedSeats, selectedFbItems) to server **
            displayConfirmationModal();
        });
    }

     // Confirmation Modal Close Buttons & Backdrop (MODIFIED)
    if (modal) {
        closeModalButtons?.forEach(button => {
            button.addEventListener('click', () => {
                closeModal();
                resetAllSelections();
                // Return to the main booking view (step 1 essentially)
                showSection('booking-flow-section');
                hideSeatAndSummary(() => { // Hide seating/summary *within* booking flow
                    updateProgressSteps(1); // Reset progress visuals
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                });
            });
        });

        modal.addEventListener('click', (event) => { // Backdrop click
            if (event.target === modal) {
                closeModal();
                resetAllSelections();
                // Return to the main booking view
                showSection('booking-flow-section');
                hideSeatAndSummary(() => { // Hide seating/summary *within* booking flow
                     updateProgressSteps(1); // Reset progress visuals
                     window.scrollTo({ top: 0, behavior: 'smooth' });
                });
            }
        });
    }

    // Trailer Button Click
    trailerButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent movie card click when clicking button
            const youtubeId = button.dataset.youtubeId;
            if (youtubeId && !youtubeId.startsWith('YOUR_')) { // Basic check for placeholder
                openTrailerModal(youtubeId);
            } else {
                console.warn("No valid YouTube ID found for this trailer button.");
                // Optionally alert the user: alert("ขออภัย ไม่พบวิดีโอตัวอย่าง");
            }
        });
    });

    // Trailer Modal Close Button & Backdrop
    if (trailerModal) {
        trailerModalCloseBtn?.addEventListener('click', closeTrailerModal);
        trailerModal.addEventListener('click', (event) => {
            if (event.target === trailerModal) {
                closeTrailerModal();
            }
        });
    }

    // Close Modals with Escape key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            if (modal && !modal.classList.contains('hidden')) {
                // Close confirmation modal and return to booking flow
                closeModal();
                resetAllSelections();
                showSection('booking-flow-section');
                 hideSeatAndSummary(() => {
                    updateProgressSteps(1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                 });
            }
            if (trailerModal && !trailerModal.classList.contains('hidden')) {
                closeTrailerModal();
            }
        }
    });

    // --- NEW: Navigation Event Listeners ---
    if (navLinkMovies) {
        navLinkMovies.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('booking-flow-section');
        });
    }

    if (navLinkBranches) {
        navLinkBranches.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('branch-info-section');
        });
    }

    if (navLinkPromotions) {
        navLinkPromotions.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('promotion-section');
        });
    }


    // --- Helper Functions ---

    function updateSelectedMovieDetails(movie) {
        if (currentPoster && movie?.poster) {
            currentPoster.src = movie.poster;
            currentPoster.alt = (movie.title || '') + " Poster";
        }
        if (currentMovieTitle && movie?.title) {
            currentMovieTitle.textContent = movie.title;
        }
    }

    // Update Summary Display (Including F&B)
    function updateSummaryDisplay() {
        if (summaryMovieSpan) summaryMovieSpan.textContent = selectedMovie?.title || '-';
        if (summaryBranchSpan) summaryBranchSpan.textContent = selectedBranch || '-';
        if (summaryDateSpan) summaryDateSpan.textContent = selectedDate ? formatDate(selectedDate) : '-';
        if (summaryTimeSpan) summaryTimeSpan.textContent = selectedTime || '-';

        const seatIds = selectedSeats.map(seat => seat.id).sort();
        const seatTotalPrice = selectedSeats.reduce((sum, seat) => sum + (seat.price || 0), 0);
        if (selectedSeatsSpan) selectedSeatsSpan.textContent = seatIds.length > 0 ? seatIds.join(', ') : '-';
        if (seatCountSpan) seatCountSpan.textContent = selectedSeats.length;

        let fbSummaryText = '-';
        let fbTotalPrice = 0;
        const fbItemsArray = [];
        for (const itemId in selectedFbItems) {
            const item = selectedFbItems[itemId];
            if (item && item.quantity > 0) {
                fbItemsArray.push(`${item.name} x${item.quantity}`);
                fbTotalPrice += item.quantity * item.price;
            }
        }
        if (fbItemsArray.length > 0) fbSummaryText = fbItemsArray.join(', ');

        if (summaryFbItemsSpan) summaryFbItemsSpan.textContent = fbSummaryText;
        if (summaryFbPriceSpan) summaryFbPriceSpan.textContent = fbTotalPrice;

        const overallTotalPrice = seatTotalPrice + fbTotalPrice;
        if (totalPriceSpan) totalPriceSpan.textContent = overallTotalPrice;

        // Update Confirm Button State
        if (confirmBtn) confirmBtn.disabled = selectedSeats.length === 0 || !selectedTime;
    }

    // Update F&B Subtotal Display
    function updateFbSubtotal() {
        let subtotal = 0;
        for (const itemId in selectedFbItems) {
            const item = selectedFbItems[itemId];
             if (item && item.quantity > 0) {
                 subtotal += item.quantity * item.price;
             }
        }
        if (fbSubtotalPriceSpan) fbSubtotalPriceSpan.textContent = subtotal;
    }

    // Reset only time selection and clear subsequent steps visually
    function resetTimeSelection() {
        selectedTime = null;
        const currentSelectedTimeBtn = timeButtonsContainer?.querySelector('.selected-time');
        if (currentSelectedTimeBtn) {
            currentSelectedTimeBtn.classList.remove('selected-time');
        }
        // No need to reset seats/F&B here, handled when a *new* time is selected or explicitly reset
        // Don't update summary here, handled by caller or when new time is selected
    }

    // Reset Time, Seats, F&B Selections and related UI
    function resetAllSelections() {
        // Reset Time
        resetTimeSelection();

        // Reset Seats State & UI
        seatsContainer?.querySelectorAll('.seat.selected').forEach(seat => seat.classList.remove('selected'));
        selectedSeats = [];

        // Reset F&B State & UI
        selectedFbItems = {};
        document.querySelectorAll('.fb-item-card .quantity-display').forEach(display => {
            if(display) display.textContent = '0';
        });
        updateFbSubtotal(); // Reset F&B subtotal display to 0

        // Update the main summary after all resets
        updateSummaryDisplay();

        // Clear countdown if running
        clearInterval(countdownInterval);
        if (countdownTimerSpan) countdownTimerSpan.textContent = "10:00";
        timerSeconds = 600;
    }


    // Hide Seating, F&B, and Summary sections *within* the booking flow
    function hideSeatAndSummary(callback) {
        let sectionsToHideCount = 0;
        let sectionsHiddenCount = 0;
        const sections = [seatingSection, fbSection, summarySection];
        const timeoutDuration = FADE_DURATION + 50; // Buffer

        const onHideComplete = () => {
            sectionsHiddenCount++;
            if (sectionsHiddenCount >= sectionsToHideCount) {
                 clearInterval(countdownInterval); // Stop timer when hiding these sections
                 if (countdownTimerSpan) countdownTimerSpan.textContent = "10:00";
                 if (callback) callback(); // Execute callback after all are hidden
            }
        };

        sections.forEach(section => {
            if (section && !section.classList.contains('hidden')) {
                sectionsToHideCount++;
                section.classList.add('fade-out');
                setTimeout(() => {
                    section.classList.add('hidden');
                    section.classList.remove('fade-out', 'fade-in'); // Cleanup classes
                    onHideComplete();
                }, timeoutDuration); // Use timeout matching animation
            }
        });

        // If no sections were visible to start with, run callback immediately
        if (sectionsToHideCount === 0) {
             clearInterval(countdownInterval); // Ensure timer stops
             if (countdownTimerSpan) countdownTimerSpan.textContent = "10:00";
             if (callback) callback();
        }
    }

    // Show Seating, F&B, and Summary sections *within* the booking flow
    function showSeatAndSummary() {
        // Reset only seats state here when showing seating plan; F&B persists
        seatsContainer?.querySelectorAll('.seat.selected').forEach(seat => seat.classList.remove('selected'));
        selectedSeats = [];
        updateSummaryDisplay(); // Update summary (shows time, 0 seats, existing F&B)

        const sections = [seatingSection, fbSection, summarySection];

        sections.forEach(section => {
             if (section) {
                 section.classList.remove('hidden', 'fade-out');
                 // Force reflow hack for animation restart
                 void section.offsetWidth;
                 section.classList.add('fade-in');
             }
        });

        startCountdown(); // Start timer when seating/F&B becomes visible
    }

    function startCountdown() {
        clearInterval(countdownInterval);
        timerSeconds = 600;
        updateTimerDisplay();

        countdownInterval = setInterval(() => {
            timerSeconds--;
            updateTimerDisplay();
            if (timerSeconds < 0) {
                clearInterval(countdownInterval);
                alert('ขออภัย, หมดเวลาในการเลือกที่นั่ง/อาหารแล้ว กรุณาเริ่มใหม่อีกครั้ง');
                resetAllSelections();
                // Stay on booking flow, but hide seat selection parts
                hideSeatAndSummary(() => {
                    updateProgressSteps(1); // Back to step 1 visually
                    // Optionally scroll back to movie selection or booking details
                     const movieSelectionElement = document.querySelector('.movie-selection');
                     if (movieSelectionElement) {
                        movieSelectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                     }
                });
            }
        }, 1000);
    }

    function resetCountdown() {
         // Only reset if timer is active (interval exists) and hasn't run out
         if(countdownInterval && timerSeconds > 0) {
             timerSeconds = 600; // Reset to full time
             updateTimerDisplay(); // Update display immediately
         }
    }

    function updateTimerDisplay() {
        if (!countdownTimerSpan) return;
        const minutes = Math.floor(Math.max(0, timerSeconds) / 60); // Ensure non-negative
        const seconds = Math.max(0, timerSeconds) % 60;
        countdownTimerSpan.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }

    function showLoading() {
        loadingOverlay?.classList.remove('hidden');
    }

    function hideLoading() {
        loadingOverlay?.classList.add('hidden');
    }

    // Update Progress Steps (MODIFIED to check visibility)
    function updateProgressSteps(stepNumber) {
        // Only update steps if the booking flow is actually visible
        if (bookingFlowSection && !bookingFlowSection.classList.contains('hidden')) {
             // Check if progressSection itself is visible first
             if (progressSection && !progressSection.classList.contains('hidden')) {
                document.querySelectorAll('.progress-steps .step').forEach((step, index) => {
                    step.classList.remove('active'); // Reset first for clarity
                    if ((index + 1) <= stepNumber) {
                        step.classList.add('active');
                    }
                });
             }
        }
        // If booking flow is hidden, do nothing to the steps
    }

    // Display Confirmation Modal (Including F&B)
    function displayConfirmationModal() {
        if (!modal || !modalSummaryDiv) return;

        const seatTotalPrice = selectedSeats.reduce((sum, seat) => sum + (seat.price || 0), 0);
        const seatIds = selectedSeats.map(seat => seat.id).sort().join(', ') || '-';

        let fbModalItemsHTML = '';
        let fbTotalPrice = 0;
        for (const itemId in selectedFbItems) {
            const item = selectedFbItems[itemId];
            if (item && item.quantity > 0) {
                 fbModalItemsHTML += `<p style="margin-bottom: 5px; padding-bottom: 5px; border-bottom: 1px dotted var(--border-color);"><strong>${item.name} x${item.quantity}:</strong> <span>${item.quantity * item.price} ฿</span></p>`;
                fbTotalPrice += item.quantity * item.price;
            }
        }
        const fbSubtotalLine = fbTotalPrice > 0
             ? `<p><strong>ราคารวม F&B:</strong> <span style="font-weight:bold;">${fbTotalPrice} ฿</span></p>`
             : '';
        const overallTotalPrice = seatTotalPrice + fbTotalPrice;

        modalSummaryDiv.innerHTML = `
            <p><strong>ภาพยนตร์:</strong> <span>${selectedMovie?.title || '-'}</span></p>
            <p><strong>สาขา:</strong> <span>${selectedBranch || '-'}</span></p>
            <p><strong>วันที่:</strong> <span>${selectedDate ? formatDate(selectedDate) : '-'}</span></p>
            <p><strong>รอบฉาย:</strong> <span>${selectedTime || '-'}</span></p>
            <p><strong>ที่นั่ง (${selectedSeats.length}):</strong> <span>${seatIds}</span></p>
            ${fbModalItemsHTML ? '<hr style="border-top: 1px dashed var(--border-color); margin: 10px 0;">' + fbModalItemsHTML : ''}
            ${fbSubtotalLine ? fbSubtotalLine : ''}
            <hr style="border-top: 1px solid var(--border-color); margin: 15px 0;">
            <p style="border-bottom: none; padding-bottom: 0; margin-bottom: 0;"><strong>ราคารวมสุทธิ:</strong> <span style="color: var(--accent-red); font-weight: bold; font-size: 1.2em;">${overallTotalPrice} บาท</span></p>
        `;
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Prevent background scroll
    }

    function closeModal() { // For Confirmation Modal
        if (!modal) return;
        modal.classList.add('hidden');
        document.body.style.overflow = ''; // Restore scroll
        // State reset is handled by the listeners calling this
    }

    // Open Trailer Modal
    function openTrailerModal(youtubeId) {
        if (!trailerModal || !youtubePlayerContainer) return;
        // Standard YouTube embed URL
        youtubePlayerContainer.innerHTML = `
            <iframe
                src="https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen>
            </iframe>`;
        trailerModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    // Close Trailer Modal
    function closeTrailerModal() {
        if (!trailerModal || !youtubePlayerContainer) return;
        youtubePlayerContainer.innerHTML = ''; // Stop video by removing iframe
        trailerModal.classList.add('hidden');
        document.body.style.overflow = '';
    }

    // Format Date String (DD/MM/YYYY)
    function formatDate(dateString) {
         try {
            if (!dateString) return '-';
            // Basic check for YYYY-MM-DD format
            const parts = dateString.split('-');
            if (parts.length === 3) {
                const [year, month, day] = parts;
                if (!isNaN(parseInt(year)) && !isNaN(parseInt(month)) && !isNaN(parseInt(day))) {
                     return `${day}/${month}/${year}`;
                }
            }
            console.error("Invalid date string format:", dateString);
            return dateString; // Return original if format is unexpected
         } catch (error) {
             console.error("Error formatting date:", dateString, error);
             return dateString; // Return original on error
         }
    }

    // --- NEW: Function to Show/Hide Main Sections ---
    function showSection(sectionIdToShow) {
        const sectionToShow = document.getElementById(sectionIdToShow);
        if (!sectionToShow) {
            console.error("Section not found:", sectionIdToShow);
            return;
        }

        // 1. Hide all other main sections with fade-out effect
        allMainSections.forEach(section => {
            if (section && section.id !== sectionIdToShow && !section.classList.contains('hidden')) {
                section.classList.add('fade-out');
                // Use setTimeout to add 'hidden' after animation starts
                setTimeout(() => {
                    section.classList.add('hidden');
                    section.classList.remove('fade-out', 'fade-in'); // Cleanup
                }, FADE_DURATION); // Match CSS transition duration
            } else if (section && section.id !== sectionIdToShow) {
                 // Ensure sections already hidden stay hidden and clean up classes
                 section.classList.add('hidden');
                 section.classList.remove('fade-in', 'fade-out');
            }
        });

        // 2. Show the target section with fade-in effect
        // Use a minimal timeout to ensure hide animations have begun triggering layout changes
        setTimeout(() => {
            sectionToShow.classList.remove('hidden', 'fade-out');
            // Force reflow hack for animation restart (important!)
            void sectionToShow.offsetWidth;
            sectionToShow.classList.add('fade-in');

            // 3. Update active nav link
            allNavLinks.forEach(link => link.classList.remove('active'));
            let activeLink;
            if (sectionIdToShow === 'booking-flow-section') activeLink = navLinkMovies;
            else if (sectionIdToShow === 'branch-info-section') activeLink = navLinkBranches;
            else if (sectionIdToShow === 'promotion-section') activeLink = navLinkPromotions;
            if (activeLink) activeLink.classList.add('active');

            // 4. Show/Hide progress bar based on section
            if (progressSection) {
                if (sectionIdToShow === 'booking-flow-section') {
                    progressSection.classList.remove('hidden');
                    // Determine the correct step based on current state
                     let currentStep = 1;
                     if(selectedTime) currentStep = 2;
                     if(selectedTime && selectedSeats.length > 0) {
                         // Check if confirm button was clicked or modal shown?
                         // For now, assume step 2 if time is selected, step 1 otherwise
                         // Let the confirm button logic handle step 3 update
                     }
                    updateProgressSteps(currentStep);
                } else {
                    progressSection.classList.add('hidden');
                }
            }

            // Scroll to top when changing main sections for better UX
             window.scrollTo({ top: 0, behavior: 'smooth' });

        }, 50); // Small delay (e.g., 50ms)
    }


}); // End DOMContentLoaded