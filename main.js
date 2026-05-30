const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('[data-nav]');

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

const year = document.querySelector('[data-year]');
if (year) {
  year.textContent = new Date().getFullYear();
}

const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

const bookingForm = document.querySelector('[data-booking-form]');

if (bookingForm) {
  const steps = Array.from(bookingForm.querySelectorAll('[data-step]'));
  const indicators = Array.from(document.querySelectorAll('[data-step-indicator]'));
  const dateInput = bookingForm.querySelector('[data-booking-date]');
  const timeSelect = bookingForm.querySelector('[data-booking-time]');
  const summary = bookingForm.querySelector('[data-summary]');
  const finalSummary = bookingForm.querySelector('[data-final-summary]');
  const hiddenService = bookingForm.querySelector('[data-selected-service]');
  const hiddenDuration = bookingForm.querySelector('[data-selected-duration]');
  const hiddenPrice = bookingForm.querySelector('[data-selected-price]');
  let currentStep = 1;

  const pad = (value) => String(value).padStart(2, '0');
  const formatDateInput = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

  const today = new Date();
  const minDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (dateInput) {
    dateInput.min = formatDateInput(minDate);
  }

  const getSelectedService = () => {
    const checked = bookingForm.querySelector('input[name="service"]:checked');
    if (!checked) return null;
    return {
      name: checked.value,
      duration: Number(checked.dataset.duration || 30),
      price: checked.dataset.price || 'по запитване'
    };
  };

  const setStep = (step) => {
    currentStep = step;
    steps.forEach((item) => item.classList.toggle('is-active', Number(item.dataset.step) === step));
    indicators.forEach((item) => item.classList.toggle('is-active', Number(item.dataset.stepIndicator) === step));
    window.scrollTo({ top: bookingForm.offsetTop - 110, behavior: 'smooth' });
  };

  const markError = (element) => {
    if (!element) return;
    element.classList.add('field-error');
    element.addEventListener('input', () => element.classList.remove('field-error'), { once: true });
    element.addEventListener('change', () => element.classList.remove('field-error'), { once: true });
  };

  const generateSlots = () => {
    if (!timeSelect || !dateInput) return;
    timeSelect.innerHTML = '<option value="">Избери час</option>';

    const selectedService = getSelectedService();
    const duration = selectedService ? selectedService.duration : 30;
    const value = dateInput.value;
    if (!value) {
      timeSelect.innerHTML = '<option value="">Първо избери дата</option>';
      return;
    }

    const selectedDate = new Date(`${value}T12:00:00`);
    const day = selectedDate.getDay();

    if (day === 0) {
      timeSelect.innerHTML = '<option value="">Неделя е почивен ден</option>';
      return;
    }

    const openMinutes = 10 * 60;
    const closeMinutes = 20 * 60;
    const stepMinutes = 30;

    for (let minutes = openMinutes; minutes + duration <= closeMinutes; minutes += stepMinutes) {
      const hour = Math.floor(minutes / 60);
      const minute = minutes % 60;
      const option = document.createElement('option');
      option.value = `${pad(hour)}:${pad(minute)}`;
      option.textContent = `${pad(hour)}:${pad(minute)}`;
      timeSelect.appendChild(option);
    }
  };

  const updateSummary = () => {
    const selectedService = getSelectedService();
    if (selectedService) {
      hiddenService.value = selectedService.name;
      hiddenDuration.value = `${selectedService.duration} мин`;
      hiddenPrice.value = selectedService.price;
    }

    if (summary) {
      if (!selectedService) {
        summary.innerHTML = '<span>Избрана услуга:</span><strong>Още няма избрана услуга</strong>';
      } else {
        summary.innerHTML = `<span>Избрана услуга:</span><strong>${selectedService.name} • ${selectedService.duration} мин • ${selectedService.price}</strong>`;
      }
    }

    if (finalSummary) {
      const date = dateInput?.value || 'няма избрана дата';
      const time = timeSelect?.value || 'няма избран час';
      const serviceText = selectedService ? `${selectedService.name} • ${selectedService.duration} мин` : 'няма избрана услуга';
      finalSummary.innerHTML = `
        <span>Провери заявката:</span>
        <strong>${serviceText}</strong>
        <span>Дата: ${date}</span>
        <span>Час: ${time}</span>
      `;
    }
  };

  bookingForm.querySelectorAll('input[name="service"]').forEach((input) => {
    input.addEventListener('change', () => {
      updateSummary();
      generateSlots();
    });
  });

  dateInput?.addEventListener('change', () => {
    generateSlots();
    updateSummary();
  });

  timeSelect?.addEventListener('change', updateSummary);

  bookingForm.querySelectorAll('[data-next]').forEach((button) => {
    button.addEventListener('click', () => {
      if (currentStep === 1) {
        const checked = bookingForm.querySelector('input[name="service"]:checked');
        if (!checked) {
          const firstOption = bookingForm.querySelector('.service-option-body');
          markError(firstOption);
          return;
        }
        updateSummary();
        generateSlots();
        setStep(2);
        return;
      }

      if (currentStep === 2) {
        let ok = true;
        if (!dateInput?.value) {
          markError(dateInput);
          ok = false;
        }
        if (!timeSelect?.value) {
          markError(timeSelect);
          ok = false;
        }
        if (!ok) return;
        updateSummary();
        setStep(3);
      }
    });
  });

  bookingForm.querySelectorAll('[data-prev]').forEach((button) => {
    button.addEventListener('click', () => {
      setStep(Math.max(1, currentStep - 1));
    });
  });

  bookingForm.addEventListener('submit', (event) => {
    const selectedService = getSelectedService();
    if (!selectedService || !dateInput?.value || !timeSelect?.value || !bookingForm.reportValidity()) {
      event.preventDefault();
      if (!selectedService) setStep(1);
      else if (!dateInput?.value || !timeSelect?.value) setStep(2);
      return;
    }
    updateSummary();
  });

  updateSummary();
}


const calBooking = document.querySelector('[data-cal-booking]');

if (calBooking) {
  const serviceButtons = Array.from(calBooking.querySelectorAll('[data-cal-service]'));
  const frame = calBooking.querySelector('[data-cal-frame]');
  const openLink = calBooking.querySelector('[data-cal-open-link]');
  const currentTitle = calBooking.querySelector('[data-cal-current-title]');

  const buildCalUrl = (rawUrl) => {
    const url = new URL(rawUrl);
    url.searchParams.set('embed', 'true');
    url.searchParams.set('theme', 'dark');
    return url.href;
  };

  const selectService = (button) => {
    if (!button || !frame) return;
    const url = button.dataset.calUrl;
    const title = button.dataset.calTitle || button.textContent.trim();

    serviceButtons.forEach((item) => item.classList.toggle('is-selected', item === button));
    frame.src = buildCalUrl(url);

    if (openLink) openLink.href = url;
    if (currentTitle) currentTitle.textContent = title;
  };

  serviceButtons.forEach((button) => {
    button.addEventListener('click', () => selectService(button));
  });
}
