// Google Apps Script deployment ID - replace with your actual deployment ID
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw28WZ-azcMcLiDp2FS4H0MkOEIW4rwuC9N5cxrx2aJhVebEdVxlBmsUgREoXLcTwaO/exec';

let schoolData = [];

async function fetchSchoolData() {
  showLoading(true);
  try {
    const response = await fetch(APPS_SCRIPT_URL);
    if (!response.ok) {
      throw new Error('網路連線異常');
    }
    const data = await response.json();
    if (!data || data.error) {
      throw new Error(data.error || '資料格式錯誤');
    }
    schoolData = data;
    renderSchools(schoolData);
  } catch (error) {
    console.error('Error fetching school data:', error);
    showError(error.message || '資料載入失敗，請稍後再試');
  } finally {
    showLoading(false);
  }
}

function showLoading(show) {
  const loader = document.getElementById('loadingIndicator');
  if (show) {
    loader.classList.remove('hidden');
  } else {
    loader.classList.add('hidden');
  }
}

function showError(message) {
  const container = document.getElementById('schoolList');
  
  // Remove any existing error messages
  const existingErrors = document.querySelectorAll('.error-message');
  existingErrors.forEach(error => error.remove());
  
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  
  // Create icon element
  const icon = document.createElement('i');
  icon.className = 'fas fa-exclamation-circle';
  
  // Create message element
  const messageSpan = document.createElement('span');
  messageSpan.textContent = message;
  
  // Append elements to error div
  errorDiv.appendChild(icon);
  errorDiv.appendChild(messageSpan);
  
  container.prepend(errorDiv);
  
  // Remove error message after 5 seconds with fade out animation
  setTimeout(() => {
    errorDiv.style.transition = 'all 0.5s ease';
    errorDiv.style.opacity = '0';
    errorDiv.style.transform = 'translateY(-20px)';
    setTimeout(() => {
      errorDiv.remove();
    }, 500);
  }, 5000);
}

function createSchoolCard(school) {
  const card = document.createElement('div');
  card.className = 'school-card';
  
  const name = document.createElement('div');
  name.className = 'school-name';
  name.innerHTML = `<i class="fas fa-graduation-cap"></i> ${school.name}（${school.location}）`;
  
  const type = document.createElement('div');
  type.className = 'school-type';
  type.innerHTML = `<i class="fas ${school.type === 'public' ? 'fa-building-columns' : 'fa-building'}"></i> ${school.type === 'public' ? '公立' : '私立'}`;
  
  const departments = document.createElement('div');
  departments.className = 'departments';
  
  school.departments.forEach(dept => {
    const deptEl = document.createElement('span');
    deptEl.className = 'department';
    deptEl.innerHTML = `<i class="fas fa-book"></i> ${dept}`;
    departments.appendChild(deptEl);
  });
  
  card.appendChild(name);
  card.appendChild(type);
  card.appendChild(departments);
  
  requestAnimationFrame(() => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    requestAnimationFrame(() => {
      card.style.transition = 'all 0.5s ease';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    });
  });
  
  return card;
}

function renderSchools(schools) {
  const container = document.getElementById('schoolList');
  container.innerHTML = '';
  schools.forEach(school => {
    container.appendChild(createSchoolCard(school));
  });
}

function search() {
  const searchText = document.getElementById('searchInput').value.toLowerCase();
  const filteredSchools = schoolData.filter(school => {
    return school.name.toLowerCase().includes(searchText) ||
           school.departments.some(dept => dept.toLowerCase().includes(searchText));
  });
  renderSchools(filteredSchools);
  scrollToTop();
}

function filterByType(type) {
  const buttons = document.querySelectorAll('.filters button');
  buttons.forEach(button => button.classList.remove('active'));
  event.target.classList.add('active');
  
  let filteredSchools;
  if (type === 'all') {
    filteredSchools = schoolData;
  } else {
    // Convert Chinese type to English for filtering
    const typeMap = {
      '公立': 'public',
      '私立': 'private'
    };
    filteredSchools = schoolData.filter(school => school.type === typeMap[type]);
  }
  
  renderSchools(filteredSchools);
  scrollToTop();
}

function handleScroll() {
  const scrollButton = document.querySelector('.scroll-to-top');
  if (window.scrollY > 300) {
    scrollButton.classList.add('visible');
  } else {
    scrollButton.classList.remove('visible');
  }
}

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

function updateYear() {
  const yearElement = document.getElementById('currentYear');
  yearElement.textContent = new Date().getFullYear();
}

function updateTime() {
  const timeElement = document.getElementById('currentTime');
  const now = new Date();
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };
  timeElement.innerHTML = `<i class="far fa-clock"></i> ${now.toLocaleDateString('zh-TW', options)}`;
}

function toggleMobileMenu() {
  const menu = document.querySelector('.nav-menu');
  const overlay = document.querySelector('.menu-overlay');
  const menuBtn = document.querySelector('.mobile-menu-btn i');
  
  menu.classList.toggle('active');
  overlay.classList.toggle('active');
  
  if (menu.classList.contains('active')) {
    menuBtn.classList.remove('fa-bars');
    menuBtn.classList.add('fa-times');
    document.body.style.overflow = 'hidden'; // Prevent scrolling when menu is open
  } else {
    menuBtn.classList.remove('fa-times');
    menuBtn.classList.add('fa-bars');
    document.body.style.overflow = ''; // Restore scrolling when menu is closed
  }
}

document.addEventListener('DOMContentLoaded', () => {
  fetchSchoolData();
  updateYear();
  updateTime();
  
  document.getElementById('searchInput').addEventListener('input', () => {
    search();
  });
  
  // Close mobile menu when clicking outside
  document.addEventListener('click', (e) => {
    const menu = document.querySelector('.nav-menu');
    const menuBtn = document.querySelector('.mobile-menu-btn');
    
    if (menu.classList.contains('active') && 
        !e.target.closest('.nav-menu') && 
        !e.target.closest('.mobile-menu-btn')) {
      menu.classList.remove('active');
      menuBtn.querySelector('i').classList.remove('fa-times');
      menuBtn.querySelector('i').classList.add('fa-bars');
    }
  });
  
  // Close menu when clicking menu items
  document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', () => {
      toggleMobileMenu();
    });
  });

  // Handle escape key to close menu
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const menu = document.querySelector('.nav-menu');
      if (menu.classList.contains('active')) {
        toggleMobileMenu();
      }
    }
  });
  
  // Add scroll to top button functionality
  window.addEventListener('scroll', handleScroll);
  
  // Add scroll to top button click handler
  document.querySelector('.scroll-to-top').addEventListener('click', scrollToTop);
  
  setInterval(updateTime, 1000);
});