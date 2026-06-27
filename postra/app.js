const PostraApp = {
    state: {
        currentUser: null,
        token: localStorage.getItem('token') || null,
        threads: [],
        currentBoard: 'home',
        boards: ['technology', 'programming', 'ai', 'startups', 'careers', 'gaming', 'education', 'productivity', 'open-source', 'general', 'politics', 'healthcare', 'linux'],
    },

    async init() {
        const urlParams = new URLSearchParams(window.location.search);
        const urlToken = urlParams.get('token');
        if (urlToken) {
            localStorage.setItem('token', urlToken);
            window.history.replaceState({}, document.title, "/");
            this.state.token = urlToken;
        }

        if (this.state.token) await this.fetchProfile();
        this.renderSidebar();
        this.addEventListeners();
        await this.fetchThreads('home');
        this.renderTrendingWidget();
        this.updateStats();
        this.initAssistantProtocol();
    },

    async fetchProfile() {
        try {
            const res = await fetch('/api/profile', { headers: { 'x-auth-token': this.state.token } });
            if (res.ok) { this.state.currentUser = await res.json(); this.updateAuthUI(); } else this.logout();
        } catch (e) {}
    },

    async fetchThreads(category = 'home') {
        let url = '/api/threads?sortBy=trending';
        if (category === 'popular') url = '/api/threads?sortBy=participation';
        else if (category === 'all') url = '/api/threads'; 
        else if (category === 'my-posts') url = '/api/threads/me';
        else if (category && category !== 'home') url = `/api/threads?category=${category}&sortBy=trending`;

        try {
            const headers = {};
            if(this.state.token) headers['x-auth-token'] = this.state.token;
             
            const res = await fetch(url, { headers });
            if (res.status === 403 || res.status === 401) { 
                this.state.pendingBoard = category;
                this.showLoginModal(); 
                return; 
            }
            const data = await res.json();
            this.state.threads = Array.isArray(data) ? data : [];
            this.renderThreads();
        } catch (e) {
            this.state.threads = [];
            this.renderThreads();
        }
    },

    renderThreads() {
        const container = document.getElementById('thread-list');
        if (!container) return;
        
        let displayThreads = this.state.threads;
        try {
            const hidden = JSON.parse(localStorage.getItem('hiddenThreads') || '[]');
            displayThreads = displayThreads.filter(t => !hidden.includes(t._id));
        } catch(e) {}
        
        if (displayThreads.length === 0) {
            container.innerHTML = `<div class="text-center py-20 text-muted font-bold tracking-widest text-[13px]">No discourse found.</div>`;
            return;
        }
        
        let saved = [];
        try { saved = JSON.parse(localStorage.getItem('savedThreads') || '[]'); } catch(e) {}

        container.innerHTML = displayThreads.map(t => {
            const rawTitle = typeof t.title === 'string' ? t.title : "Untitled Discourse";
            const sourceMatch = rawTitle.match(/^\[(.*?)\] (.*)/);
            const cleanTitle = sourceMatch ? sourceMatch[2] : rawTitle;
            const isSaved = saved.includes(t._id);

            return `
            <div class="bg-surface border border-border rounded-xl hover:border-muted transition-colors cursor-pointer flex flex-col mb-4 group" onclick="PostraApp.openThread('${t._id}')">
                <div class="px-4 py-3 pb-2 flex-1">
                    <!-- Header -->
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center gap-2 text-xs text-muted">
                            <div class="w-5 h-5 rounded-full bg-white flex items-center justify-center overflow-hidden">
                                <img src="https://picsum.photos/seed/${t.category}/20" class="w-full h-full object-cover">
                            </div>
                            <span class="font-bold text-foreground hover:underline cursor-pointer">p/${t.category}</span>
                            <span class="opacity-50 text-[10px]">•</span>
                            <span>${Math.floor(Math.random() * 12) + 1} hr. ago</span>
                        </div>
                        <div class="flex items-center gap-2 relative">
                            ${this.state.currentUser && this.state.currentUser.joinedBoards && this.state.currentUser.joinedBoards.includes(t.category) ? 
                            `<button onclick="event.stopPropagation();" class="px-3 py-1 bg-transparent border border-muted text-muted text-xs font-bold rounded-full cursor-default">Joined</button>` 
                            : `<button onclick="event.stopPropagation(); PostraApp.joinBoard('${t.category}')" class="px-3 py-1 bg-primary text-foreground text-xs font-bold rounded-full hover:bg-blue-600 transition-colors">Join</button>`}
                            
                            <button onclick="event.stopPropagation(); PostraApp.toggleMenu('${t._id}')" class="w-8 h-8 flex items-center justify-center text-muted hover:bg-accent rounded-full transition-colors"><i class="fa-solid fa-ellipsis"></i></button>
                            <div id="menu-${t._id}" class="hidden absolute right-0 top-full mt-1 w-32 bg-[#1a1a1b] border border-border rounded-md shadow-lg z-20 py-1" onclick="event.stopPropagation();">
                                <button onclick="PostraApp.saveThread('${t._id}')" class="w-full text-left px-4 py-2 text-xs text-foreground hover:bg-accent flex items-center gap-2"><i class="fa-solid fa-bookmark text-muted w-4"></i> <span id="save-text-${t._id}">${isSaved ? 'Unsave' : 'Save'}</span></button>
                                <button onclick="PostraApp.hideThread('${t._id}')" class="w-full text-left px-4 py-2 text-xs text-foreground hover:bg-accent flex items-center gap-2"><i class="fa-solid fa-eye-slash text-muted w-4"></i> Hide</button>
                                <button onclick="PostraApp.reportThread('${t._id}')" class="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-accent flex items-center gap-2"><i class="fa-solid fa-flag w-4"></i> Report</button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Title -->
                    <h2 class="text-lg font-semibold text-foreground mb-2 leading-tight">${cleanTitle}</h2>
                    
                    <!-- Description Snippet -->
                    ${(t.description || '').length > 5 ? `<p class="text-[13px] text-muted mb-4 line-clamp-3">${(t.description || '').split('\n\nLink: ')[0]}</p>` : ''}
                </div>
                
                ${t.image ? `<div class="w-full bg-background overflow-hidden flex items-center justify-center max-h-[500px]"><img src="/api/proxy-image?url=${encodeURIComponent(t.image)}" onerror="this.parentElement.style.display='none'" class="w-full max-h-[500px] object-contain"></div>` : ''}
                
                <!-- Footer area -->
                <div class="px-2 py-2 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                         <button onclick="event.stopPropagation(); PostraApp.openThread('${t._id}')" class="flex items-center gap-2 px-3 py-1.5 bg-accent hover:bg-border text-foreground rounded-full transition-all text-[12px] font-bold">
                              <i class="fa-regular fa-comment text-sm"></i> 
                              <span>${t.commentCount || 30}</span>
                         </button>
                         <button onclick="event.stopPropagation();" class="flex items-center gap-2 px-3 py-1.5 bg-accent hover:bg-border text-foreground rounded-full transition-all text-[12px] font-bold">
                              <i class="fa-solid fa-share text-sm"></i>
                              <span>Share</span>
                         </button>
                    </div>
                    <span class="text-[9px] text-muted font-bold tracking-widest uppercase opacity-20 pr-4">GRADE ${t.tagQualityScore || 125}</span>
                </div>
            </div>`;
        }).join('');
    },

    toggleMenu(id) {
        const menu = document.getElementById(`menu-${id}`);
        const isHidden = menu.classList.contains('hidden');
        document.querySelectorAll('[id^="menu-"]').forEach(el => el.classList.add('hidden'));
        if (isHidden) menu.classList.remove('hidden');
    },

    saveThread(id) {
        let saved = [];
        try { saved = JSON.parse(localStorage.getItem('savedThreads') || '[]'); } catch(e) {}
        const isSaved = saved.includes(id);
        
        if (isSaved) {
            saved = saved.filter(tId => tId !== id);
            alert('Post unsaved.');
        } else {
            saved.push(id);
            alert('Post saved successfully.');
        }
        localStorage.setItem('savedThreads', JSON.stringify(saved));
        this.renderThreads();
    },

    hideThread(id) {
        let hidden = [];
        try { hidden = JSON.parse(localStorage.getItem('hiddenThreads') || '[]'); } catch(e) {}
        if (!hidden.includes(id)) {
            hidden.push(id);
            localStorage.setItem('hiddenThreads', JSON.stringify(hidden));
        }
        this.renderThreads();
    },

    reportThread(id) {
        this.toggleMenu(id);
        alert('Thank you for your report. The moderation team will review this discourse.');
        this.hideThread(id);
    },

    setBoard(board) { 
        const restricted = ['politics', 'healthcare'];
        if(restricted.includes(board) && !this.state.token) { 
            this.state.pendingBoard = board;
            this.showLoginModal(); 
            return; 
        }
        this.state.currentBoard = board; 
        this.fetchThreads(board); 
        this.renderSidebar(); 
        const threadList = document.getElementById('thread-list');
        if (threadList) threadList.innerHTML = `
            <div class="text-center py-20 text-muted" id="loader">
                <i class="fa-solid fa-circle-notch fa-spin text-3xl mb-4"></i>
                <p class="font-bold tracking-widest text-sm">LOADING...</p>
            </div>`;
    },

    renderSidebar() {
        const list = document.getElementById('sidebar-boards');
        if (list) {
            list.innerHTML = this.state.boards.map(b => `
                <li class="nav-item ${this.state.currentBoard === b ? 'bg-accent rounded-md' : 'rounded-md hover:bg-accent transition-colors'}">
                    <a href="#" class="flex items-center gap-3 py-2 px-3 text-sm font-medium ${this.state.currentBoard === b ? 'text-foreground' : 'text-muted hover:text-foreground'}" onclick="PostraApp.setBoard('${b}')">
                        <div class="w-[6px] h-[6px] rounded-full bg-red-500"></div> 
                        p/${b}
                    </a>
                </li>`).join('');
        }
        
        const joinedSection = document.getElementById('joined-boards-section');
        const joinedList = document.getElementById('sidebar-joined-boards');
        if (joinedSection && joinedList) {
            joinedSection.classList.remove('hidden');
            if (this.state.currentUser && this.state.currentUser.joinedBoards && this.state.currentUser.joinedBoards.length > 0) {
                joinedList.innerHTML = this.state.currentUser.joinedBoards.map(b => `
                    <li class="nav-item ${this.state.currentBoard === b ? 'bg-accent rounded-md' : 'rounded-md hover:bg-accent transition-colors'}">
                        <a href="#" class="flex items-center gap-3 py-2 px-3 text-sm font-medium ${this.state.currentBoard === b ? 'text-foreground' : 'text-muted hover:text-foreground'}" onclick="PostraApp.setBoard('${b}')">
                            <i class="fa-brands fa-diaspora text-primary text-xs"></i>
                            p/${b}
                        </a>
                    </li>`).join('');
            } else {
                joinedList.innerHTML = `<li class="text-xs text-muted px-3 italic">You haven't joined any boards yet.</li>`;
            }
        }
    },

    async joinBoard(board) {
        if (!this.state.token) {
            this.showLoginModal();
            return;
        }
        try {
            const res = await fetch('/api/join-board', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-auth-token': this.state.token
                },
                body: JSON.stringify({ board })
            });
            if (res.ok) {
                this.state.currentUser = await res.json();
                this.renderSidebar();
                this.renderThreads(); 
                this.setBoard(board);
            }
        } catch(e) {}
    },

    async openThread(id) {
        try {
            const res = await fetch(`/api/threads/${id}`);
            if(!res.ok) { this.showLoginModal(); return; }
            const t = await res.json();
            const cRes = await fetch(`/api/comments/${id}`);
            const comments = await cRes.json();
            this.renderThreadPage(t, comments);
        } catch(e) { console.error("Thread Sync Conflict."); }
    },

    renderThreadPage(t, comments) {
        const container = document.getElementById('main-content');
        
        const buildTree = (allComments, parentId = null) => {
            return allComments.filter(c => c.parentId == parentId).map(c => ({
                ...c,
                replies: buildTree(allComments, c._id)
            }));
        };

        const tree = buildTree(comments);

        const highUtility = tree.filter(c => c.qualityColor === 'green');
        const generalDiscourse = tree.filter(c => c.qualityColor === 'orange');
        const lowUtility = tree.filter(c => c.qualityColor === 'red');

        const rawTitle = typeof t.title === 'string' ? t.title : "Untitled Discourse";
        const sourceMatch = rawTitle.match(/^\[(.*?)\] (.*)/);
        const cleanTitle = sourceMatch ? sourceMatch[2] : rawTitle;

        const rawDesc = typeof t.description === 'string' ? t.description : "";
        const descriptionParts = rawDesc.split('\n\nLink: ');
        const mainDesc = descriptionParts[0];

        container.innerHTML = `
            <div class="max-w-[740px] mx-auto py-4">
                <button onclick="PostraApp.resetToHome()" class="text-[11px] font-bold text-muted hover:text-foreground mb-6 uppercase tracking-wider flex items-center gap-2 group transition-all"><i class="fa-solid fa-arrow-left group-hover:-translate-x-1 transition-transform"></i> Back</button>
                <div class="bg-surface border border-border rounded-xl mb-6">
                    <div class="p-6">
                        <div class="flex items-center gap-2 text-xs text-muted mb-4">
                            <div class="w-6 h-6 rounded-full bg-white flex items-center justify-center overflow-hidden">
                                <img src="https://picsum.photos/seed/${t.category}/30" class="w-full h-full object-cover">
                            </div>
                            <span class="font-bold text-foreground hover:underline cursor-pointer" onclick="PostraApp.setBoard('${t.category}')">p/${t.category}</span>
                            <span class="opacity-50">•</span>
                            <span>Posted by u/${t.author ? t.author.username || 'analyst' : 'analyst'} • 6 hr. ago</span>
                            ${this.state.currentUser && this.state.currentUser.joinedBoards && this.state.currentUser.joinedBoards.includes(t.category) ? 
                            `<button class="px-3 py-1 ml-2 bg-transparent border border-muted text-muted text-[10px] font-bold rounded-full cursor-default uppercase">Joined</button>` 
                            : `<button onclick="PostraApp.joinBoard('${t.category}')" class="px-3 py-1 ml-2 bg-primary text-foreground text-[10px] font-bold rounded-full hover:bg-blue-600 transition-colors uppercase tracking-wider">Join</button>`}
                        </div>
                        <h1 class="text-xl font-semibold mb-3 text-foreground">${cleanTitle}</h1>
                        <p class="text-sm text-foreground leading-relaxed mb-6 whitespace-pre-wrap">${mainDesc}</p>
                        <div class="flex items-center gap-3 mt-4 text-[11px] font-bold text-muted border-t border-border pt-4">
                            <span class="mr-2 uppercase tracking-wider text-[10px]">Grade Discourse:</span>
                            <button class="hover:bg-accent px-2 py-1 rounded transition-colors flex items-center gap-1" onclick="PostraApp.tagThreadHandler('Useful', '${t._id}')">
                                <i class="fa-solid fa-arrow-up text-green-500"></i> <span class="text-green-500">Useful</span> (${t.usefulTags || 0})
                            </button>
                            <button class="hover:bg-accent px-2 py-1 rounded transition-colors flex items-center gap-1" onclick="PostraApp.tagThreadHandler('Important', '${t._id}')">
                                <i class="fa-solid fa-star text-blue-500"></i> <span class="text-blue-500">Important</span> (${t.importantTags || 0})
                            </button>
                            <button class="hover:bg-accent px-2 py-1 rounded transition-colors flex items-center gap-1" onclick="PostraApp.tagThreadHandler('Waste', '${t._id}')">
                                <i class="fa-solid fa-arrow-down text-red-500"></i> <span class="text-red-500">Waste</span> (${t.wasteTags || 0})
                            </button>
                        </div>
                    </div>
                    ${t.image ? `<img src="/api/proxy-image?url=${encodeURIComponent(t.image)}" onerror="this.style.display='none'" class="w-full bg-background max-h-[500px] object-contain">` : ''}
                </div>
                
                <!-- Main Comment Box -->
                <div class="bg-surface border border-border rounded-lg p-4 mb-8">
                    <p class="text-sm mb-2 text-foreground">Comment as <span class="font-bold text-primary">${this.state.token ? this.state.currentUser?.username : 'guest'}</span></p>
                    <textarea id="main-comment-input" class="w-full bg-background border border-border rounded-md p-3 text-sm text-foreground focus:outline-none focus:border-muted transition-colors min-h-[100px]" placeholder="What are your thoughts?"></textarea>
                    <div class="flex justify-end mt-2">
                        <button onclick="PostraApp.submitComment('${t._id}', null)" class="px-5 py-1.5 bg-primary hover:bg-blue-600 transition-colors text-foreground rounded-full text-sm font-bold">Comment</button>
                    </div>
                </div>

                <div class="space-y-6">
                    ${this.renderCommentSection('Useful Information', 'border-green-500/30 bg-green-500/5', highUtility, t._id, 'text-green-500')}
                    ${this.renderCommentSection('Average Discourse', 'border-orange-500/30 bg-orange-500/5', generalDiscourse, t._id, 'text-orange-500')}
                    ${this.renderCommentSection('Memes / Waste', 'border-red-500/30 bg-red-500/5', lowUtility, t._id, 'text-red-500')}
                </div>
            </div>`;
    },

    renderCommentSection(title, bgClass, items, threadId, titleClass) {
        if (!items || items.length === 0) return '';
        return `
            <div class="border rounded-xl ${bgClass} p-4 mt-4">
                <h3 class="text-sm font-bold uppercase tracking-wider mb-4 ${titleClass}">${title}</h3>
                <div class="space-y-4">
                    ${items.map(c => this.renderCommentNode(c, threadId)).join('')}
                </div>
            </div>`;
    },

    renderCommentNode(c, threadId) {
        const timeAgo = Math.floor(Math.random() * 5) + 1 + "h ago"; // MOCK
        let badge = c.qualityColor === 'green' ? '<i class="fa-solid fa-circle-check text-green-500 ml-1"></i>' : 
                   (c.qualityColor === 'red' ? '<i class="fa-solid fa-triangle-exclamation text-red-500 ml-1"></i>' : '');
        
        return `
            <div class="flex flex-col mt-2">
                <div class="flex items-center gap-2 text-xs text-muted mb-1">
                    <div class="w-6 h-6 rounded-full bg-border flex items-center justify-center overflow-hidden">
                        <img src="https://picsum.photos/seed/${c.author}/30" class="w-full h-full object-cover">
                    </div>
                    <span class="font-bold text-foreground hover:underline cursor-pointer">${c.author}</span>
                    ${badge}
                    <span>• ${timeAgo}</span>
                </div>
                <div class="text-sm text-foreground pl-8 pr-4 whitespace-pre-wrap leading-relaxed">${c.content}</div>
                <div class="flex items-center gap-3 pl-8 mt-2 text-[11px] font-bold text-muted">
                    <button class="hover:bg-accent px-2 py-1 rounded transition-colors flex items-center gap-1" onclick="document.getElementById('reply-to-${c._id}').classList.toggle('hidden')">
                        <i class="fa-regular fa-comment"></i> Reply
                    </button>
                    <button class="hover:bg-accent px-2 py-1 rounded transition-colors flex items-center gap-1" onclick="PostraApp.tagHandler('Useful', '${c._id}', '${threadId}')">
                        <i class="fa-solid fa-arrow-up text-green-500"></i> <span class="text-green-500">Useful</span> (${c.usefulTags || 0})
                    </button>
                    <button class="hover:bg-accent px-2 py-1 rounded transition-colors flex items-center gap-1" onclick="PostraApp.tagHandler('Average', '${c._id}', '${threadId}')">
                        <i class="fa-solid fa-minus text-orange-500"></i> <span class="text-orange-500">Average</span> (${c.averageTags || 0})
                    </button>
                    <button class="hover:bg-accent px-2 py-1 rounded transition-colors flex items-center gap-1" onclick="PostraApp.tagHandler('Memes', '${c._id}', '${threadId}')">
                        <i class="fa-solid fa-arrow-down text-red-500"></i> <span class="text-red-500">Memes</span> (${c.memeTags || 0})
                    </button>
                </div>
                
                <div id="reply-to-${c._id}" class="hidden pl-8 mt-3 relative">
                    <!-- Threadline for reply box -->
                    <div class="absolute left-3 top-0 bottom-0 w-[1px] bg-border"></div>
                    <textarea id="reply-input-${c._id}" class="w-full bg-background border border-border rounded-md p-2 text-sm text-foreground focus:outline-none focus:border-muted transition-colors min-h-[80px]" placeholder="Write a reply..."></textarea>
                    <div class="flex justify-end mt-2">
                        <button onclick="PostraApp.submitComment('${threadId}', '${c._id}')" class="px-4 py-1.5 bg-primary hover:bg-blue-600 transition-colors text-foreground rounded-full text-[11px] font-bold">Reply</button>
                    </div>
                </div>
                
                ${c.replies && c.replies.length > 0 ? `
                    <div class="pl-4 mt-2 ml-3 border-l border-border/50 relative group">
                        <div class="absolute left-[-1px] top-0 bottom-0 w-[2px] bg-muted opacity-0 group-hover:opacity-50 transition-opacity cursor-pointer z-10"></div>
                        ${c.replies.map(r => this.renderCommentNode(r, threadId)).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    },

    async submitComment(threadId, parentId) {
        if (!this.state.token) {
            this.showLoginModal();
            return;
        }
        const inputId = parentId ? `reply-input-${parentId}` : 'main-comment-input';
        const input = document.getElementById(inputId);
        const content = input.value.trim();
        if (!content) return;
        
        try {
            const res = await fetch('/api/comments', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-auth-token': this.state.token
                },
                body: JSON.stringify({ threadId, parentId, content })
            });
            if (res.ok) {
                input.value = '';
                await this.openThread(threadId); // refresh
            }
        } catch(e) {}
    },

    async tagHandler(tagType, id, threadId) {
        if (!this.state.token) {
            this.showLoginModal();
            return;
        }
        try {
            await fetch(`/api/comments/${id}/tag`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-auth-token': this.state.token
                },
                body: JSON.stringify({ tagType })
            });
            await this.openThread(threadId); // refresh
        } catch(e) {}
    },

    async tagThreadHandler(tagType, targetId) {
        if (!this.state.token) {
            this.showLoginModal();
            return;
        }
        try {
            await fetch(`/api/threads/tag`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-auth-token': this.state.token
                },
                body: JSON.stringify({ targetType: 'thread', targetId, tagType })
            });
            await this.openThread(targetId); // refresh
        } catch(e) {}
    },

    initAssistantProtocol() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitRecognition || window.webkitSpeechRecognition;
        
        const voiceTrigger = document.getElementById('voice-trigger');
        const voicePanel = document.getElementById('voice-panel');
        const closeVoice = document.getElementById('close-voice');
        const sendBtn = document.getElementById('send-to-ai');
        const input = document.getElementById('assistant-input');
        const output = document.getElementById('voice-output');
        
        let headerText = voicePanel.querySelector('.flex.items-center.gap-2.text-foreground');

        if (SpeechRecognition) {
            this.assistantRecognition = new SpeechRecognition();
            this.assistantRecognition.continuous = false; 
            this.assistantRecognition.lang = 'en-US';
            
            this.assistantRecognition.onstart = () => {
                if(headerText) headerText.innerHTML = '<span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Listening...';
            };
            this.assistantRecognition.onresult = (e) => { 
                if(input) input.value = e.results[0][0].transcript; 
                this.triggerAiBrain(); 
            };
            this.assistantRecognition.onend = () => {
                if(headerText) headerText.innerHTML = 'Ask Postra';
            };
        }

        if(voiceTrigger) {
            voiceTrigger.onclick = () => { 
                voicePanel.classList.toggle('hidden'); 
                if(!voicePanel.classList.contains('hidden') && this.assistantRecognition) {
                    try { this.assistantRecognition.start(); } catch(e){} 
                }
            };
        }
        if(closeVoice) {
            closeVoice.onclick = () => { 
                voicePanel.classList.add('hidden'); 
                window.speechSynthesis.cancel(); 
                if(this.assistantRecognition) this.assistantRecognition.stop(); 
            };
        }
        if(sendBtn) sendBtn.onclick = () => this.triggerAiBrain();
        if(input) input.onkeypress = (e) => { if(e.key === 'Enter') this.triggerAiBrain(); };

        const stopBtn = document.getElementById('stop-task');
        if(stopBtn) {
            stopBtn.onclick = () => {
                if (this.currentAiController) {
                    this.currentAiController.abort();
                }
                window.speechSynthesis.cancel();
                if(this.assistantRecognition) this.assistantRecognition.stop();
                
                const loadingIndicator = document.getElementById('ai-loading');
                if (loadingIndicator) loadingIndicator.remove();
                
                stopBtn.classList.add('hidden');
                
                if (output) {
                    output.innerHTML += `
                        <div class="flex justify-start mb-3">
                            <div class="bg-border border border-border/50 rounded-xl px-4 py-2 text-foreground max-w-[95%]">
                                <p class="text-[10px] font-bold uppercase tracking-wider opacity-50">Task Aborted.</p>
                            </div>
                        </div>`;
                    output.scrollTop = output.scrollHeight;
                }
            };
        }
    },

    async triggerAiBrain() {
        const input = document.getElementById('assistant-input');
        const output = document.getElementById('voice-output');
        if(!input || !output) return;
        
        const query = input.value.trim();
        if (!query) return;
        
        input.value = '';
        output.innerHTML += `
            <div class="flex justify-end mb-3">
                <div class="bg-accent rounded-tl-xl rounded-tr-xl rounded-bl-xl px-4 py-2 text-foreground max-w-[85%]">
                    <p class="text-sm">"${query}"</p>
                </div>
            </div>
            <div class="flex items-center gap-2 text-muted font-bold text-xs animate-pulse mb-3" id="ai-loading">
                <i class="fa-solid fa-microchip"></i> Analyzing...
            </div>`;
            
        output.scrollTop = output.scrollHeight;

        const stopBtn = document.getElementById('stop-task');
        if (stopBtn) stopBtn.classList.remove('hidden');

        if (this.currentAiController) {
            this.currentAiController.abort();
        }
        this.currentAiController = new AbortController();

        try {
            const res = await fetch('/api/ai/vapi', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ query }),
                signal: this.currentAiController.signal
            });
            const result = await res.json();
            
            const loadingIndicator = document.getElementById('ai-loading');
            if (loadingIndicator) loadingIndicator.remove();

            if (result.answer) { 
                output.innerHTML += `
                    <div class="flex justify-start mb-3">
                        <div class="bg-background border border-border rounded-tl-xl rounded-tr-xl rounded-br-xl px-4 py-3 text-foreground max-w-[95%]">
                            <span class="text-[10px] font-bold text-primary uppercase block mb-1">Intelligence Output</span>
                            <p class="text-sm leading-relaxed">${result.answer}</p>
                        </div>
                    </div>`;
                this.speakResponse(result.answer); 
            } else {
                if (stopBtn) stopBtn.classList.add('hidden');
            }
        } catch (e) { 
            const loadingIndicator = document.getElementById('ai-loading');
            if (loadingIndicator) loadingIndicator.remove();
            
            const stopBtn = document.getElementById('stop-task');
            if (stopBtn) stopBtn.classList.add('hidden');

            if (e.name !== 'AbortError') {
                output.innerHTML += `
                    <div class="flex justify-start mb-3">
                        <div class="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-500 max-w-[95%]">
                            <p class="text-xs font-bold uppercase tracking-wider">Analysis fault.</p>
                        </div>
                    </div>`;
            }
        }
        output.scrollTop = output.scrollHeight;
    },

    speakResponse(text) { 
        window.speechSynthesis.cancel(); 
        const u = new SpeechSynthesisUtterance(text); 
        
        u.onend = () => {
            const stopBtn = document.getElementById('stop-task');
            if (stopBtn) stopBtn.classList.add('hidden');
        };
        u.onerror = () => {
            const stopBtn = document.getElementById('stop-task');
            if (stopBtn) stopBtn.classList.add('hidden');
        };
        
        window.speechSynthesis.speak(u); 
    },
    
    renderTrendingWidget() {
        const list = document.getElementById('trending-widget-list');
        const sorted = [...this.state.threads].sort((a,b) => (b.trendingScore || 0) - (a.trendingScore || 0)).slice(0, 3);
        list.innerHTML = sorted.map((t, i) => {
            const rawTitle = typeof t.title === 'string' ? t.title : "Untitled Discourse";
            const cleanTitle = rawTitle.replace(/^\[.*?\]\s*/, '');
            return `<div class="flex items-start gap-3 cursor-pointer group" onclick="PostraApp.openThread('${t._id}')"><span class="text-[13px] font-bold text-muted mt-0.5">${i + 1}</span><div class="flex flex-col"><p class="text-[13px] font-medium leading-snug group-hover:underline text-foreground">${cleanTitle.substring(0, 55)}...</p><span class="text-[10px] text-muted font-semibold uppercase mt-1">p/${t.category}</span></div></div>`;
        }).join('');
    },

    addEventListeners() {
        document.addEventListener('click', () => {
            document.querySelectorAll('[id^="menu-"]').forEach(el => el.classList.add('hidden'));
        });
        const openLogin = document.getElementById('open-login');
        if (openLogin) openLogin.onclick = () => this.showLoginModal();

        const logoHome = document.getElementById('logo-home');
        if (logoHome) logoHome.onclick = () => this.setBoard('home');
        
        const openCreatePost = document.getElementById('open-create-post');
        if (openCreatePost) openCreatePost.onclick = () => this.showCreatePostModal();

        const openCreateComm = document.getElementById('open-create-comm');
        if (openCreateComm) openCreateComm.onclick = () => this.showCreateBoardModal();
        
        const h = document.getElementById('feed-home'); if(h) h.onclick = () => this.setBoard('home');
        const p = document.getElementById('feed-popular'); if(p) p.onclick = () => this.setBoard('popular');
        const a = document.getElementById('feed-all'); if(a) a.onclick = () => this.setBoard('all');
        const m = document.getElementById('feed-my-posts'); if(m) m.onclick = () => this.setBoard('my-posts');

        const searchInput = document.getElementById('global-search');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const query = e.target.value.trim().toLowerCase();
                    if (query) {
                        let targetBoard = query.startsWith('p/') ? query.substring(2) : query;
                        this.setBoard(targetBoard);
                        e.target.value = '';
                    }
                }
            });
        }
    },

    async showCreatePostModal() {
        if (!this.state.token) { 
            await this.handleInstantLogin();
            if (!this.state.token) return; 
        }

        const container = document.getElementById('modal-container');
        container.innerHTML = `
            <div class="fixed inset-0 bg-background/80 flex items-center justify-center z-[250] backdrop-blur-sm animate-fadeIn">
                <div class="bg-surface border border-border p-6 rounded-xl w-full max-w-lg">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-lg font-bold text-foreground">Create a Post</h2>
                        <button onclick="document.getElementById('modal-container').innerHTML = ''" class="text-muted hover:text-foreground transition-all"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    
                    <div class="space-y-4">
                        <select id="post-board" class="w-full bg-background border border-border rounded-md p-2.5 text-sm text-foreground focus:outline-none focus:border-muted transition-colors">
                            ${this.state.boards.map(b => `<option value="${b}" ${b === this.state.currentBoard ? 'selected' : ''}>p/${b}</option>`).join('')}
                        </select>
                        
                        <input type="text" id="post-title" placeholder="Title" class="w-full bg-background border border-border rounded-md p-2.5 text-sm text-foreground focus:outline-none focus:border-muted transition-colors">
                        
                        <textarea id="post-desc" placeholder="Text (optional)" class="w-full bg-background border border-border rounded-md p-2.5 text-sm text-foreground focus:outline-none focus:border-muted transition-colors min-h-[120px]"></textarea>
                        
                        <input type="text" id="post-image" placeholder="Image URL (optional)" class="w-full bg-background border border-border rounded-md p-2.5 text-sm text-foreground focus:outline-none focus:border-muted transition-colors">
                        
                        <div class="flex justify-end gap-2 mt-4">
                            <button onclick="document.getElementById('modal-container').innerHTML = ''" class="px-4 py-2 text-sm font-bold text-muted hover:text-foreground transition-all rounded-full border border-transparent hover:border-border">Cancel</button>
                            <button onclick="PostraApp.submitPost()" class="px-6 py-2 bg-primary text-foreground text-sm font-bold rounded-full hover:bg-blue-600 transition-all">Post</button>
                        </div>
                    </div>
                </div>
            </div>`;
    },

    async submitPost() {
        const title = document.getElementById('post-title').value.trim();
        const category = document.getElementById('post-board').value;
        const description = document.getElementById('post-desc').value.trim();
        const image = document.getElementById('post-image').value.trim();
        
        if (!title) return alert("Title is required");

        try {
            const res = await fetch('/api/threads', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-auth-token': this.state.token
                },
                body: JSON.stringify({ title, description, category, image })
            });

            if (res.ok) {
                document.getElementById('modal-container').innerHTML = '';
                this.setBoard(category);
            } else {
                alert("Error creating post");
            }
        } catch(e) {
            console.error("Error submitting post", e);
            alert("Error creating post");
        }
    },

    async showCreateBoardModal() {
        if (!this.state.token) { 
            await this.handleInstantLogin();
            if (!this.state.token) return; 
        }

        const container = document.getElementById('modal-container');
        container.innerHTML = `
            <div class="fixed inset-0 bg-background/80 flex items-center justify-center z-[250] backdrop-blur-sm animate-fadeIn">
                <div class="bg-surface border border-border p-6 rounded-xl w-full max-w-sm">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-lg font-bold text-foreground">Create a Community</h2>
                        <button onclick="document.getElementById('modal-container').innerHTML = ''" class="text-muted hover:text-foreground transition-all"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    
                    <div class="space-y-4">
                        <div>
                            <label class="text-xs text-muted font-bold tracking-wider mb-1 block uppercase">Community Name</label>
                            <div class="relative">
                                <span class="absolute left-3 top-2.5 text-muted text-sm font-bold">p/</span>
                                <input type="text" id="board-name" class="w-full bg-background border border-border rounded-md py-2.5 pl-7 pr-3 text-sm text-foreground focus:outline-none focus:border-muted transition-colors" placeholder="community_name">
                            </div>
                        </div>
                        
                        <div class="flex justify-end gap-2 mt-6">
                            <button onclick="document.getElementById('modal-container').innerHTML = ''" class="px-4 py-2 text-sm font-bold text-muted hover:text-foreground transition-all rounded-full border border-transparent hover:border-border">Cancel</button>
                            <button onclick="PostraApp.submitBoard()" class="px-6 py-2 bg-primary text-foreground text-sm font-bold rounded-full hover:bg-blue-600 transition-all">Create</button>
                        </div>
                    </div>
                </div>
            </div>`;
    },

    async submitBoard() {
        let boardName = document.getElementById('board-name').value.trim().toLowerCase();
        boardName = boardName.replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        
        if (!boardName) return alert("Community name is required");

        if (!this.state.boards.includes(boardName)) {
            this.state.boards.push(boardName);
        }
        
        await this.joinBoard(boardName);
        document.getElementById('modal-container').innerHTML = '';
        this.renderSidebar();
    },

    updateStats() {
        const el = document.getElementById('status-threads');
        if (el) el.innerText = this.state.threads.length || 0; 
    },
    
    showLoginModal() {
        const container = document.getElementById('modal-container');
        container.innerHTML = `
            <div class="fixed inset-0 bg-background/80 flex items-center justify-center z-[250] backdrop-blur-sm animate-fadeIn">
                <div class="bg-surface border border-border p-8 rounded-2xl w-full max-w-sm text-center">
                    <h2 class="text-xl font-bold mb-4 text-foreground">Log In Required</h2>
                    <p class="text-sm text-muted mb-8">Access restricted.</p>
                    <button onclick="PostraApp.handleInstantLogin()" class="w-full py-3 bg-primary text-foreground font-bold rounded-full hover:bg-blue-600 transition-all">Instant Guest Login</button>
                    <button class="w-full mt-4 text-xs font-semibold text-muted hover:text-foreground transition-all" onclick="document.getElementById('modal-container').innerHTML = ''">Close</button>
                </div>
            </div>`;
    },

    async handleInstantLogin() {
        try {
            const res = await fetch('/api/auth/guest', { method: 'POST' });
            if(res.ok) {
                const r = await res.json();
                localStorage.setItem('token', r.token);
                this.state.token = r.token; this.state.currentUser = r.user;
                document.getElementById('modal-container').innerHTML = '';
                this.updateAuthUI(); 
                if (this.state.pendingBoard) {
                    this.setBoard(this.state.pendingBoard);
                    this.state.pendingBoard = null;
                } else {
                    await this.fetchThreads(this.state.currentBoard); 
                }
            }
        } catch(e) {}
    },

    updateAuthUI() { document.getElementById('auth-controls').innerHTML = `<div class="flex items-center gap-4"><p class="text-xs text-foreground font-bold">${this.state.currentUser.username}</p><button onclick="PostraApp.logout()" class="text-muted hover:text-foreground transition-all"><i class="fa-solid fa-power-off"></i></button></div>`; },
    logout() { localStorage.removeItem('token'); location.reload(); },

    resetToHome() {
        const container = document.getElementById('main-content');
        container.innerHTML = `
            <div id="feed-container" class="max-w-[740px] mx-auto space-y-4">
                <div class="premium-card p-3 flex items-center gap-2 mb-4 hover:border-muted transition-colors cursor-text" onclick="PostraApp.showCreatePostModal()">
                    <div class="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-muted ml-2">
                        <i class="fa-solid fa-user"></i>
                    </div>
                    <div class="flex-1 bg-accent border border-border hover:border-muted rounded-md py-2 px-4 mx-2 text-sm text-muted transition-colors text-left flex items-center h-10">
                        Create Post
                    </div>
                    <button class="w-10 h-10 flex items-center justify-center text-muted hover:bg-accent rounded-md transition-all mr-1" onclick="PostraApp.showCreatePostModal()">
                        <i class="fa-regular fa-image text-lg"></i>
                    </button>
                </div>
                <div id="thread-list" class="space-y-3"></div>
            </div>`;
        this.setBoard('home');
    }
};

document.addEventListener('DOMContentLoaded', () => PostraApp.init());
