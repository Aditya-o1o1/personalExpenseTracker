import Swal from 'sweetalert2';

const isLight = () => document.documentElement.dataset.theme === 'light';

export const toast = (icon, title) =>
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon,
    title,
    showConfirmButton: false,
    timer: 2600,
    timerProgressBar: true,
    background: isLight() ? '#ffffff' : '#172033',
    color: isLight() ? '#0f172a' : '#f8fafc',
  });

export const confirmAction = (title, text, confirmButtonText = 'Continue') =>
  Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#8b5cf6',
    background: isLight() ? '#ffffff' : '#172033',
    color: isLight() ? '#0f172a' : '#f8fafc',
  }).then((result) => result.isConfirmed);
