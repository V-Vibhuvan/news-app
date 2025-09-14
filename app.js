const newsContainer = document.querySelector(".news-container");
const apiKey = '76795b1fdd674e07a9f7ba38ab86bddf';

let currentPage = 1;
const pageSize = 20;

// New fetchNews with pagination
async function fetchNews(page = 1){
    showSpinner();
    newsContainer.innerHTML = `<p class="loading">Loading news...</p>`;
    const url = `https://newsapi.org/v2/top-headlines?country=us&language=en&page=${page}&pageSize=${pageSize}&apiKey=${apiKey}`;
    try{
        const response = await fetch(url);
        if(!response.ok){
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        if(data.articles.length < pageSize){
            loadMoreButton.disabled = true;
            loadMoreButton.textContent = "No More Articles";
        } else {
            loadMoreButton.disabled = false;
            loadMoreButton.textContent = "Load More";
        }

        if(page === 1){
            displayNews(data.articles);
        } else {
            appendNews(data.articles);
        }
    } catch(error){
        newsContainer.innerHTML = `<p class="no-results">Error fetching news.</p>
        <button id="retryButton">Retry</button>`;
        
        const retryButton = document.getElementById("retryButton");
        retryButton.addEventListener('click', () => fetchNews(page));
        console.error("Error fetching news: ", error);
    }
    finally{
        hideSpinner();
    }
}

// Display news (first page / search / category)
function displayNews(articles){
    newsContainer.innerHTML =  '';

    if(articles.length === 0){
        newsContainer.innerHTML = `<p class="no-results">No news articles found.</p>`;
        return;
    }

    articles.forEach(article => {
        const card = createNewsCard(article);
        newsContainer.appendChild(card);
    });
}

// Append news for "Load More"
function appendNews(articles){
    if(articles.length === 0) return;

    articles.forEach(article => {
        const card = createNewsCard(article);
        newsContainer.appendChild(card);
    });
}

// Helper to create a news card
function createNewsCard(article){
    const card = document.createElement('div');
    card.className = 'news-card';

    const date = new Date(article.publishedAt);
    const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    const sourceName = article.source.name || 'Unknown Source';

    card.innerHTML = `
        <img src="${article.urlToImage || 'https://via.placeholder.com/400x200'}" alt="News Image">
        <h3>${article.title || 'No title available'}</h3>
        <p>${article.description || 'No description available.'}</p>
        <p class="news-source">Source: ${sourceName}</p>
        <a href="${article.url}" target="_blank">Read More</a>
        <p class="news-date">${formattedDate}</p>
    `;
    return card;
}

// Search
const searchInput = document.querySelector(".search-box input");
const searchButton = document.querySelector(".search-box button");

searchButton.addEventListener('click',()=> {
    const query = searchInput.value.trim();
    if(query){
        localStorage.setItem('lastSearch', query);
        localStorage.removeItem('lastCategory');
        searchNews(query);
    }
});

searchInput.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) {
            searchNews(query);
        }
    }
});

async function searchNews(keyword, page = 1){
    showSpinner();
    const url = `https://newsapi.org/v2/everything?q=${keyword}&language=en&sortBy=publishedAt&page=${page}&pageSize=${pageSize}&apiKey=${apiKey}`;
    try{
        const response = await fetch(url);
        if(!response.ok){
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();

        if(data.articles.length < pageSize){
            loadMoreButton.disabled = true;
            loadMoreButton.textContent = "No More Articles";
        } else {
            loadMoreButton.disabled = false;
            loadMoreButton.textContent = "Load More";
        }

        if(page === 1){
            displayNews(data.articles);
        } else {
            appendNews(data.articles);
        }
    }catch(error){
        newsContainer.innerHTML = `<p class="no-results">Error fetching news.</p>
        <button id="retryButton">Retry</button>`;
        
        const retryButton = document.getElementById("retryButton");
        retryButton.addEventListener('click', () => fetchNews(page));
        console.error("Error Fetching search results: ",error);
    }
    finally{
        hideSpinner();
    }
}

// Categories
const categoryLinks = document.querySelectorAll('.nav-links a');

categoryLinks.forEach(link=>{
    link.addEventListener('click',(event)=>{
        event.preventDefault();
        searchInput.value=''; // Clear search
        categoryLinks.forEach(link=> link.classList.remove('active'));
        link.classList.add('active');
        currentPage = 1;
        const category = link.textContent.toLowerCase();
        localStorage.setItem('lastCategory', category);
        localStorage.removeItem('lastSearch');
        fetchNewsByCategory(category);
    });
});

async function fetchNewsByCategory(category, page = 1){
    showSpinner();
    const url= `https://newsapi.org/v2/top-headlines?country=us&category=${category}&language=en&page=${page}&pageSize=${pageSize}&apiKey=${apiKey}`;
    try{
        const response = await fetch(url);
        if(!response.ok){
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();

        if(data.articles.length < pageSize){
            loadMoreButton.disabled = true;
            loadMoreButton.textContent = "No More Articles";
        } else {
            loadMoreButton.disabled = false;
            loadMoreButton.textContent = "Load More";
        }

        if(page === 1){
            displayNews(data.articles);
        } else {
            appendNews(data.articles);
        }
    }catch(error){
        newsContainer.innerHTML = `<p class="no-results">Error fetching news.</p>
        <button id="retryButton">Retry</button>`;
        
        const retryButton = document.getElementById("retryButton");
        retryButton.addEventListener('click', () => fetchNews(page));
        console.error("Error fetching category news: ", error);
    }
    finally{
        hideSpinner();
    }
}

// Logo click - reset to default home
const logo = document.querySelector('.logo');
logo.addEventListener('click', () => {
    categoryLinks.forEach(link => link.classList.remove('active'));
    searchInput.value = '';
    currentPage = 1;
    fetchNews();
});

const loadMoreButton = document.getElementById('loadMoreButton');

loadMoreButton.addEventListener('click', () => {
    currentPage++;
    // Determine if search or category is active
    const activeCategory = document.querySelector('.nav-links a.active');
    const searchQuery = searchInput.value.trim();

    if(searchQuery){
        searchNews(searchQuery, currentPage);
    } else if(activeCategory){
        fetchNewsByCategory(activeCategory.textContent.toLowerCase(), currentPage);
    } else {
        fetchNews(currentPage);
    }
});

function showSpinner() {
    document.getElementById("spinner").style.display = "block";
}

function hideSpinner() {
    document.getElementById("spinner").style.display = "none";
}

const darkModeToggle = document.getElementById('darkModeToggle');

darkModeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    
    // Optional: store preference
    if(document.body.classList.contains('dark-mode')){
        localStorage.setItem('theme', 'dark');
    } else {
        localStorage.setItem('theme', 'light');
    }
});


//Local storage Concept

window.addEventListener('DOMContentLoaded',()=>{
    const lastSearch = localStorage.getItem('lastSearch');
    const lastCategory = localStorage.getItem('lastCategory');

    if(lastSearch){
        searchInput.value = lastSearch;
        searchNews(lastSearch);
    }else if(lastCategory){
        const categoryLinksArray = Array.from(categoryLinks);
        const activeLink = categoryLinksArray.find(link =>link.textContent.toLowerCase() === lastCategory);
        if(activeLink){
           activeLink.classList.add('active');
        }
        fetchNewsByCategory(lastCategory);
    } else {
        fetchNews(); // default
    }
});


// Initial load
fetchNews();
