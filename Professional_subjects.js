document.addEventListener('DOMContentLoaded', () => {
  const filterButtons = document.querySelectorAll('.filter-btn');
  const tableRows = document.querySelectorAll('#group-table tbody tr');

  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      const filter = button.getAttribute('data-filter');
      
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      tableRows.forEach(row => {
        if (filter === 'all' || row.getAttribute('data-category') === filter) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });
    });
  });

  // Popup menu functionality
  const menuToggle = document.querySelector('.menu-toggle');
  const popupMenu = document.getElementById('popup-menu');
  const menuClose = document.querySelector('.menu-close');

  menuToggle.addEventListener('click', () => {
    popupMenu.classList.add('open');
  });

  menuClose.addEventListener('click', () => {
    popupMenu.classList.remove('open');
  });

  // Close popup when a navigation link is clicked.
  const navLinks = popupMenu.querySelectorAll('.nav-links a');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      popupMenu.classList.remove('open');
    });
  });
});