// Carya Application - Main JavaScript File
class CaryaApp {
    constructor() {
        this.currentUser = null;
        this.socket = null;
        this.currentRoom = null;
        this.currentSection = 'home';
        this.jobs = [];
        this.products = [];
        this.chatRooms = [];
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadUserFromStorage();
        this.initializeSocket();
        this.loadInitialData();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.closest('.nav-link').dataset.section;
                this.navigateToSection(section);
            });
        });

        // Authentication
        document.getElementById('login-btn').addEventListener('click', () => this.showModal('login-modal'));
        document.getElementById('register-btn').addEventListener('click', () => this.showModal('register-modal'));
        document.getElementById('logout-link').addEventListener('click', () => this.logout());

        // Modal switching
        document.getElementById('switch-to-register').addEventListener('click', (e) => {
            e.preventDefault();
            this.hideModal('login-modal');
            this.showModal('register-modal');
        });

        document.getElementById('switch-to-login').addEventListener('click', (e) => {
            e.preventDefault();
            this.hideModal('register-modal');
            this.showModal('login-modal');
        });

        // Forms
        document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('register-form').addEventListener('submit', (e) => this.handleRegister(e));
        document.getElementById('job-form').addEventListener('submit', (e) => this.handleJobPost(e));
        document.getElementById('product-form').addEventListener('submit', (e) => this.handleProductPost(e));
        document.getElementById('create-room-form').addEventListener('submit', (e) => this.handleCreateRoom(e));

        // Post buttons
        document.getElementById('post-job-btn').addEventListener('click', () => {
            if (this.currentUser) {
                this.showModal('job-modal');
            } else {
                this.showToast('Please login to post a job', 'warning');
                this.showModal('login-modal');
            }
        });

        document.getElementById('post-product-btn').addEventListener('click', () => {
            if (this.currentUser) {
                this.showModal('product-modal');
            } else {
                this.showToast('Please login to post an item', 'warning');
                this.showModal('login-modal');
            }
        });

        document.getElementById('create-room-btn').addEventListener('click', () => {
            if (this.currentUser) {
                this.showModal('create-room-modal');
            } else {
                this.showToast('Please login to create a chat room', 'warning');
                this.showModal('login-modal');
            }
        });

        // Filter buttons
        document.getElementById('job-filter-btn').addEventListener('click', () => this.filterJobs());
        document.getElementById('product-filter-btn').addEventListener('click', () => this.filterProducts());

        // Chat functionality
        document.getElementById('send-btn').addEventListener('click', () => this.sendMessage());
        document.getElementById('message-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Hero buttons
        document.getElementById('get-started-btn').addEventListener('click', () => {
            if (this.currentUser) {
                this.navigateToSection('jobs');
            } else {
                this.showModal('register-modal');
            }
        });

        document.getElementById('learn-more-btn').addEventListener('click', () => {
            document.querySelector('.features').scrollIntoView({ behavior: 'smooth' });
        });

        // Marketplace tabs
        document.querySelectorAll('.marketplace-tabs .tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchMarketplaceTab(tab);
            });
        });

        // Chat tabs
        document.querySelectorAll('.chat-tabs .tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchChatTab(tab);
            });
        });

        // Modal close buttons
        document.querySelectorAll('.close-btn, [data-modal]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.dataset.modal || e.target.closest('[data-modal]')?.dataset.modal;
                if (modal) {
                    this.hideModal(modal);
                }
            });
        });

        // Product type radio buttons
        document.querySelectorAll('input[name="item-type"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const conditionGroup = document.getElementById('condition-group');
                if (e.target.value === 'service') {
                    conditionGroup.style.display = 'none';
                    document.getElementById('product-condition').required = false;
                } else {
                    conditionGroup.style.display = 'block';
                    document.getElementById('product-condition').required = true;
                }
            });
        });

        // Global search
        document.getElementById('global-search').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performGlobalSearch(e.target.value);
            }
        });

        // Mobile toggle
        document.getElementById('mobile-toggle').addEventListener('click', () => {
            document.getElementById('nav-menu').classList.toggle('active');
        });
    }

    // Authentication Methods
    async handleLogin(e) {
        e.preventDefault();
        this.showSpinner();

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                this.currentUser = data.user;
                localStorage.setItem('carya_token', data.token);
                localStorage.setItem('carya_user', JSON.stringify(data.user));
                
                this.updateAuthUI();
                this.hideModal('login-modal');
                this.showToast('Welcome back!', 'success');
                this.connectSocket();
            } else {
                this.showToast(data.message || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showToast('Network error. Please try again.', 'error');
        } finally {
            this.hideSpinner();
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        this.showSpinner();

        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;

        if (password !== confirmPassword) {
            this.showToast('Passwords do not match', 'error');
            this.hideSpinner();
            return;
        }

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                this.currentUser = data.user;
                localStorage.setItem('carya_token', data.token);
                localStorage.setItem('carya_user', JSON.stringify(data.user));
                
                this.updateAuthUI();
                this.hideModal('register-modal');
                this.showToast('Welcome to Carya!', 'success');
                this.connectSocket();
            } else {
                this.showToast(data.message || 'Registration failed', 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showToast('Network error. Please try again.', 'error');
        } finally {
            this.hideSpinner();
        }
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('carya_token');
        localStorage.removeItem('carya_user');
        
        if (this.socket) {
            this.socket.disconnect();
        }
        
        this.updateAuthUI();
        this.navigateToSection('home');
        this.showToast('Logged out successfully', 'info');
    }

    loadUserFromStorage() {
        const token = localStorage.getItem('carya_token');
        const user = localStorage.getItem('carya_user');
        
        if (token && user) {
            this.currentUser = JSON.parse(user);
            this.updateAuthUI();
            this.connectSocket();
        }
    }

    updateAuthUI() {
        const authBtns = document.querySelector('.auth-btn');
        const userProfile = document.getElementById('user-profile');
        
        if (this.currentUser) {
            document.querySelector('.auth-btn').style.display = 'none';
            document.querySelector('.auth-btn.primary').style.display = 'none';
            userProfile.classList.remove('hidden');
            
            document.getElementById('username').textContent = this.currentUser.username;
            if (this.currentUser.avatar) {
                document.getElementById('profile-avatar').src = this.currentUser.avatar;
            }
        } else {
            document.querySelector('.auth-btn').style.display = 'inline-block';
            document.querySelector('.auth-btn.primary').style.display = 'inline-block';
            userProfile.classList.add('hidden');
        }
    }

    // Navigation Methods
    navigateToSection(section) {
        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.section === section) {
                link.classList.add('active');
            }
        });

        // Show/hide sections
        document.querySelectorAll('.section').forEach(sec => {
            sec.classList.remove('active');
            if (sec.id === section) {
                sec.classList.add('active');
            }
        });

        this.currentSection = section;

        // Load section-specific data
        switch (section) {
            case 'jobs':
                this.loadJobs();
                break;
            case 'marketplace':
                this.loadProducts();
                break;
            case 'chat':
                this.loadChatRooms();
                break;
        }
    }

    // Job Methods
    async loadJobs() {
        try {
            const response = await fetch('/api/jobs');
            const data = await response.json();
            
            if (response.ok) {
                this.jobs = data.jobs;
                this.renderJobs();
            }
        } catch (error) {
            console.error('Error loading jobs:', error);
            this.showToast('Failed to load jobs', 'error');
        }
    }

    renderJobs() {
        const grid = document.getElementById('jobs-grid');
        
        if (this.jobs.length === 0) {
            grid.innerHTML = '<p class="text-center">No jobs found. Be the first to post one!</p>';
            return;
        }

        grid.innerHTML = this.jobs.map(job => `
            <div class="job-card" data-job-id="${job._id}">
                <div class="job-header">
                    <div>
                        <h3 class="job-title">${job.title}</h3>
                        <p class="job-company">${job.company}</p>
                    </div>
                    <span class="job-type">${job.jobType}</span>
                </div>
                <div class="job-location">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${job.location}</span>
                </div>
                <p class="job-description">${job.description}</p>
                <div class="job-footer">
                    <div class="job-actions">
                        <button class="action-btn like-btn" onclick="app.toggleJobLike('${job._id}')">
                            <i class="fas fa-heart"></i>
                            <span>${job.likes?.length || 0}</span>
                        </button>
                        <button class="action-btn comment-btn" onclick="app.showJobComments('${job._id}')">
                            <i class="fas fa-comment"></i>
                            <span>${job.comments?.length || 0}</span>
                        </button>
                        <button class="action-btn share-btn" onclick="app.shareJob('${job._id}')">
                            <i class="fas fa-share"></i>
                            <span>${job.shares?.length || 0}</span>
                        </button>
                        <button class="btn primary small" onclick="app.applyForJob('${job._id}')">
                            Apply
                        </button>
                    </div>
                    <span class="job-meta">${this.formatDate(job.createdAt)}</span>
                </div>
            </div>
        `).join('');
    }

    async handleJobPost(e) {
        e.preventDefault();
        this.showSpinner();

        const formData = {
            title: document.getElementById('job-title').value,
            company: document.getElementById('job-company').value,
            category: document.getElementById('job-category').value,
            jobType: document.getElementById('job-type').value,
            location: document.getElementById('job-location').value,
            description: document.getElementById('job-description').value,
            salary: {
                min: document.getElementById('job-min-salary').value || null,
                max: document.getElementById('job-max-salary').value || null
            }
        };

        try {
            const response = await fetch('/api/jobs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('carya_token')}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                this.hideModal('job-modal');
                this.showToast('Job posted successfully!', 'success');
                document.getElementById('job-form').reset();
                this.loadJobs();
            } else {
                this.showToast(data.message || 'Failed to post job', 'error');
            }
        } catch (error) {
            console.error('Error posting job:', error);
            this.showToast('Network error. Please try again.', 'error');
        } finally {
            this.hideSpinner();
        }
    }

    async toggleJobLike(jobId) {
        if (!this.currentUser) {
            this.showToast('Please login to like jobs', 'warning');
            return;
        }

        try {
            const response = await fetch(`/api/jobs/${jobId}/like`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('carya_token')}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                this.loadJobs(); // Refresh to show updated likes
            } else {
                this.showToast(data.message || 'Failed to like job', 'error');
            }
        } catch (error) {
            console.error('Error liking job:', error);
        }
    }

    async shareJob(jobId) {
        if (!this.currentUser) {
            this.showToast('Please login to share jobs', 'warning');
            return;
        }

        try {
            const response = await fetch(`/api/jobs/${jobId}/share`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('carya_token')}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                this.showToast('Job shared!', 'success');
                this.loadJobs(); // Refresh to show updated shares
            } else {
                this.showToast(data.message || 'Failed to share job', 'error');
            }
        } catch (error) {
            console.error('Error sharing job:', error);
        }
    }

    async applyForJob(jobId) {
        if (!this.currentUser) {
            this.showToast('Please login to apply for jobs', 'warning');
            this.showModal('login-modal');
            return;
        }

        try {
            const response = await fetch(`/api/jobs/${jobId}/apply`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('carya_token')}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                this.showToast('Application submitted!', 'success');
            } else {
                this.showToast(data.message || 'Failed to apply', 'error');
            }
        } catch (error) {
            console.error('Error applying for job:', error);
        }
    }

    filterJobs() {
        // Implement job filtering logic
        const category = document.getElementById('job-category-filter').value;
        const jobType = document.getElementById('job-type-filter').value;
        const location = document.getElementById('job-location-filter').value;
        const search = document.getElementById('job-search-filter').value;

        let filteredJobs = this.jobs;

        if (category) {
            filteredJobs = filteredJobs.filter(job => job.category === category);
        }
        if (jobType) {
            filteredJobs = filteredJobs.filter(job => job.jobType === jobType);
        }
        if (location) {
            filteredJobs = filteredJobs.filter(job => 
                job.location.toLowerCase().includes(location.toLowerCase())
            );
        }
        if (search) {
            filteredJobs = filteredJobs.filter(job => 
                job.title.toLowerCase().includes(search.toLowerCase()) ||
                job.description.toLowerCase().includes(search.toLowerCase())
            );
        }

        // Temporarily store filtered jobs and render
        const originalJobs = this.jobs;
        this.jobs = filteredJobs;
        this.renderJobs();
        this.jobs = originalJobs;
    }

    // Marketplace Methods
    async loadProducts() {
        try {
            const response = await fetch('/api/marketplace');
            const data = await response.json();
            
            if (response.ok) {
                this.products = data.products;
                this.renderProducts();
            }
        } catch (error) {
            console.error('Error loading products:', error);
            this.showToast('Failed to load products', 'error');
        }
    }

    renderProducts() {
        const grid = document.getElementById('products-grid');
        
        if (this.products.length === 0) {
            grid.innerHTML = '<p class="text-center">No products found. Be the first to post one!</p>';
            return;
        }

        grid.innerHTML = this.products.map(product => `
            <div class="product-card" data-product-id="${product._id}">
                <div class="product-image">
                    ${product.isService ? '<i class="fas fa-handshake"></i>' : '<i class="fas fa-box"></i>'}
                    <span class="product-badge">${product.condition || 'Service'}</span>
                </div>
                <div class="product-content">
                    <h3 class="product-title">${product.title}</h3>
                    <p class="product-price">$${product.price.amount}</p>
                    <p class="product-seller">by ${product.seller?.username || 'Unknown'}</p>
                    <p class="product-description">${product.description}</p>
                    <div class="product-footer">
                        <div class="product-rating">
                            <span class="stars">★★★★☆</span>
                            <span>${product.averageRating || 0} (${product.totalReviews || 0})</span>
                        </div>
                        <div class="product-actions">
                            <button class="action-btn" onclick="app.toggleProductFavorite('${product._id}')">
                                <i class="fas fa-heart"></i>
                            </button>
                            <button class="btn primary small">
                                ${product.isService ? 'Contact' : 'Buy'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async handleProductPost(e) {
        e.preventDefault();
        this.showSpinner();

        const isService = document.querySelector('input[name="item-type"]:checked').value === 'service';

        const formData = {
            title: document.getElementById('product-title').value,
            price: {
                amount: parseFloat(document.getElementById('product-price').value)
            },
            category: document.getElementById('product-category').value,
            condition: isService ? 'new' : document.getElementById('product-condition').value,
            location: document.getElementById('product-location').value,
            description: document.getElementById('product-description').value,
            isService: isService
        };

        try {
            const response = await fetch('/api/marketplace', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('carya_token')}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                this.hideModal('product-modal');
                this.showToast(`${isService ? 'Service' : 'Product'} posted successfully!`, 'success');
                document.getElementById('product-form').reset();
                this.loadProducts();
            } else {
                this.showToast(data.message || 'Failed to post item', 'error');
            }
        } catch (error) {
            console.error('Error posting product:', error);
            this.showToast('Network error. Please try again.', 'error');
        } finally {
            this.hideSpinner();
        }
    }

    switchMarketplaceTab(tab) {
        document.querySelectorAll('.marketplace-tabs .tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tab) {
                btn.classList.add('active');
            }
        });

        // Filter products based on tab
        let filteredProducts = this.products;
        if (tab === 'services') {
            filteredProducts = this.products.filter(p => p.isService);
        } else if (tab === 'products') {
            filteredProducts = this.products.filter(p => !p.isService);
        }

        // Temporarily store filtered products and render
        const originalProducts = this.products;
        this.products = filteredProducts;
        this.renderProducts();
        this.products = originalProducts;
    }

    filterProducts() {
        // Implement product filtering logic similar to jobs
        const category = document.getElementById('product-category-filter').value;
        const condition = document.getElementById('product-condition-filter').value;
        const minPrice = document.getElementById('min-price-filter').value;
        const maxPrice = document.getElementById('max-price-filter').value;
        const search = document.getElementById('product-search-filter').value;

        let filteredProducts = this.products;

        if (category) {
            filteredProducts = filteredProducts.filter(product => product.category === category);
        }
        if (condition) {
            filteredProducts = filteredProducts.filter(product => product.condition === condition);
        }
        if (minPrice) {
            filteredProducts = filteredProducts.filter(product => product.price.amount >= parseFloat(minPrice));
        }
        if (maxPrice) {
            filteredProducts = filteredProducts.filter(product => product.price.amount <= parseFloat(maxPrice));
        }
        if (search) {
            filteredProducts = filteredProducts.filter(product => 
                product.title.toLowerCase().includes(search.toLowerCase()) ||
                product.description.toLowerCase().includes(search.toLowerCase())
            );
        }

        // Temporarily store filtered products and render
        const originalProducts = this.products;
        this.products = filteredProducts;
        this.renderProducts();
        this.products = originalProducts;
    }

    // Chat Methods
    initializeSocket() {
        if (this.currentUser) {
            this.connectSocket();
        }
    }

    connectSocket() {
        if (!this.currentUser) return;

        this.socket = io();

        this.socket.emit('join_user', {
            id: this.currentUser.id,
            username: this.currentUser.username,
            avatar: this.currentUser.avatar
        });

        this.socket.on('receive_message', (data) => {
            this.displayMessage(data);
        });

        this.socket.on('user_joined_room', (user) => {
            this.showToast(`${user.username} joined the room`, 'info');
        });

        this.socket.on('user_left_room', (user) => {
            this.showToast(`${user.username} left the room`, 'info');
        });
    }

    async loadChatRooms() {
        try {
            const response = await fetch('/api/chat/rooms');
            const data = await response.json();
            
            if (response.ok) {
                this.chatRooms = data.rooms;
                this.renderChatRooms();
            }
        } catch (error) {
            console.error('Error loading chat rooms:', error);
        }
    }

    renderChatRooms() {
        const roomsList = document.getElementById('rooms-list');
        
        if (this.chatRooms.length === 0) {
            roomsList.innerHTML = '<p class="text-center">No rooms found. Create one to get started!</p>';
            return;
        }

        roomsList.innerHTML = this.chatRooms.map(room => `
            <div class="room-item" onclick="app.joinRoom('${room._id}')">
                <div class="room-avatar">${room.name.charAt(0).toUpperCase()}</div>
                <div class="room-info">
                    <h4>${room.name}</h4>
                    <p class="room-meta">${room.memberCount} members • ${room.category}</p>
                </div>
            </div>
        `).join('');
    }

    async joinRoom(roomId) {
        if (!this.currentUser) {
            this.showToast('Please login to join chat rooms', 'warning');
            return;
        }

        try {
            const response = await fetch(`/api/chat/rooms/${roomId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('carya_token')}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                this.currentRoom = data;
                this.showChatRoom();
                this.loadMessages(roomId);
                
                if (this.socket) {
                    this.socket.emit('join_room', roomId);
                }
            } else {
                this.showToast(data.message || 'Failed to join room', 'error');
            }
        } catch (error) {
            console.error('Error joining room:', error);
        }
    }

    showChatRoom() {
        document.getElementById('chat-welcome').classList.add('hidden');
        document.getElementById('chat-room').classList.remove('hidden');
        
        document.getElementById('room-name').textContent = this.currentRoom.name;
        document.getElementById('room-members').textContent = `${this.currentRoom.memberCount} members`;
    }

    async loadMessages(roomId) {
        try {
            const response = await fetch(`/api/chat/rooms/${roomId}/messages`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('carya_token')}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                this.displayMessages(data.messages);
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }

    displayMessages(messages) {
        const messagesContainer = document.getElementById('chat-messages');
        
        messagesContainer.innerHTML = messages.map(message => `
            <div class="message ${message.sender._id === this.currentUser.id ? 'own' : ''}">
                <img src="${message.sender.avatar || 'https://via.placeholder.com/36'}" 
                     alt="${message.sender.username}" class="message-avatar">
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-sender">${message.sender.username}</span>
                        <span class="message-time">${this.formatTime(message.createdAt)}</span>
                    </div>
                    <div class="message-text">${message.content}</div>
                </div>
            </div>
        `).join('');

        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    displayMessage(message) {
        const messagesContainer = document.getElementById('chat-messages');
        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.sender.id === this.currentUser.id ? 'own' : ''}`;
        
        messageElement.innerHTML = `
            <img src="${message.sender.avatar || 'https://via.placeholder.com/36'}" 
                 alt="${message.sender.username}" class="message-avatar">
            <div class="message-content">
                <div class="message-header">
                    <span class="message-sender">${message.sender.username}</span>
                    <span class="message-time">${this.formatTime(new Date())}</span>
                </div>
                <div class="message-text">${message.content}</div>
            </div>
        `;

        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    sendMessage() {
        const input = document.getElementById('message-input');
        const content = input.value.trim();

        if (!content || !this.currentRoom) return;

        if (this.socket) {
            this.socket.emit('send_message', {
                roomId: this.currentRoom._id,
                content: content
            });

            // Display own message immediately
            this.displayMessage({
                sender: {
                    id: this.currentUser.id,
                    username: this.currentUser.username,
                    avatar: this.currentUser.avatar
                },
                content: content
            });

            input.value = '';
        }
    }

    async handleCreateRoom(e) {
        e.preventDefault();
        this.showSpinner();

        const formData = {
            name: document.getElementById('room-name').value,
            description: document.getElementById('room-description').value,
            category: document.getElementById('room-category').value,
            type: document.getElementById('room-type').value
        };

        try {
            const response = await fetch('/api/chat/rooms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('carya_token')}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                this.hideModal('create-room-modal');
                this.showToast('Chat room created successfully!', 'success');
                document.getElementById('create-room-form').reset();
                this.loadChatRooms();
            } else {
                this.showToast(data.message || 'Failed to create room', 'error');
            }
        } catch (error) {
            console.error('Error creating room:', error);
            this.showToast('Network error. Please try again.', 'error');
        } finally {
            this.hideSpinner();
        }
    }

    switchChatTab(tab) {
        document.querySelectorAll('.chat-tabs .tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tab) {
                btn.classList.add('active');
            }
        });

        // Load different room types based on tab
        // This would be implemented with different API calls
        this.loadChatRooms();
    }

    // Utility Methods
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.add('active');
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('active');
    }

    showSpinner() {
        document.getElementById('loading-spinner').classList.remove('hidden');
    }

    hideSpinner() {
        document.getElementById('loading-spinner').classList.add('hidden');
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        const container = document.getElementById('toast-container');
        container.appendChild(toast);

        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

        if (diffInHours < 1) {
            return 'Just now';
        } else if (diffInHours < 24) {
            return `${diffInHours}h ago`;
        } else {
            const diffInDays = Math.floor(diffInHours / 24);
            return `${diffInDays}d ago`;
        }
    }

    formatTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    async loadInitialData() {
        // Load some sample data for demonstration
        this.createSampleData();
    }

    createSampleData() {
        // Create sample jobs
        this.jobs = [
            {
                _id: '1',
                title: 'Frontend Developer',
                company: 'TechCorp',
                location: 'San Francisco, CA',
                jobType: 'full-time',
                category: 'technology',
                description: 'We are looking for a skilled Frontend Developer to join our dynamic team...',
                likes: [],
                comments: [],
                shares: [],
                createdAt: new Date().toISOString()
            },
            {
                _id: '2',
                title: 'UX Designer',
                company: 'DesignStudio',
                location: 'New York, NY',
                jobType: 'contract',
                category: 'design',
                description: 'Seeking a creative UX Designer to help create amazing user experiences...',
                likes: [],
                comments: [],
                shares: [],
                createdAt: new Date(Date.now() - 86400000).toISOString()
            }
        ];

        // Create sample products
        this.products = [
            {
                _id: '1',
                title: 'MacBook Pro 2023',
                price: { amount: 1999 },
                condition: 'like-new',
                category: 'electronics',
                description: 'Barely used MacBook Pro in excellent condition...',
                isService: false,
                seller: { username: 'techseller' },
                averageRating: 4.5,
                totalReviews: 3
            },
            {
                _id: '2',
                title: 'Web Development Service',
                price: { amount: 50 },
                category: 'technology',
                description: 'Professional web development services for small businesses...',
                isService: true,
                seller: { username: 'webdev_pro' },
                averageRating: 5,
                totalReviews: 12
            }
        ];

        // Create sample chat rooms
        this.chatRooms = [
            {
                _id: '1',
                name: 'General Discussion',
                category: 'general',
                memberCount: 25,
                type: 'public'
            },
            {
                _id: '2',
                name: 'Job Seekers',
                category: 'jobs',
                memberCount: 18,
                type: 'public'
            },
            {
                _id: '3',
                name: 'Tech Talk',
                category: 'tech',
                memberCount: 42,
                type: 'public'
            }
        ];

        // Render initial data if on respective sections
        if (this.currentSection === 'jobs') {
            this.renderJobs();
        } else if (this.currentSection === 'marketplace') {
            this.renderProducts();
        } else if (this.currentSection === 'chat') {
            this.renderChatRooms();
        }
    }

    performGlobalSearch(query) {
        if (!query.trim()) return;

        // For now, just navigate to jobs section and filter
        this.navigateToSection('jobs');
        document.getElementById('job-search-filter').value = query;
        this.filterJobs();
        
        this.showToast(`Searching for "${query}"`, 'info');
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CaryaApp();
});

// Global click handler for modal backgrounds
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// Handle browser back/forward buttons
window.addEventListener('popstate', (e) => {
    const hash = window.location.hash.substring(1);
    if (hash && window.app) {
        window.app.navigateToSection(hash);
    }
});