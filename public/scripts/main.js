let state = {  
  links: [],
  categories: []
};

function setupMenu() {
  let mainNav = $('#js-menu');
  let navBarToggle = $('#js-navbar-toggle');

  navBarToggle.click(function() {
    mainNav.toggleClass('active');
  });

  $('.js-add-new-link').click(function(e)  {    
    e.preventDefault();
    if (isLoggedIn()) {
      showAddLinkForm();
    } else {
      showLogin();
    }
    
  })

  $('.js-show-links').click(function(e) {
    e.preventDefault();    
    if (isLoggedIn()) {
      displayLinks(state.links, null, true);
    } else {
      showLogin();
    }
    
  });
  
}

function watchLoginForm() {  
 
  $('.js-form-login').submit(function(e) {
    hideError();
    e.preventDefault();    
    const username = $(this).find('input[name=username]').val();
    const password = $(this).find('input[name=password]').val();
    const data = { username, password }   
    fetch('api/auth/login', {
      method: 'POST',
      headers: new Headers({
        'Accept': 'application/json',
        'Content-Type': 'application/json',       
      }),
      body: JSON.stringify(data)
    })
    .then(res => {     
      if (res.status === 401) {             
        throw new Error('Incorrect username or password');
      } else {
        return res.json();
      }        
    })
    .then(json => {    
      // save the JWT to sessionStorage        
      sessionStorage.setItem('jwt', json.authToken);
      $('.js-login-container').hide();
      //  If the user had entered a url to get to the page and was not yet logged in,
      // go ahead and save the link the user had entered (which should be saved in sessionStorage)
      if (sessionStorage.getItem('urlToSave')) {
        saveLink('POST', sessionStorage.getItem('urlToSave'), sessionStorage.getItem('category'))
        .then(() => {
          clearLinkToSave();
          showLinks();
        })
        .catch(err => { throw new Error( err.message )});
      } else {
        showLinks();
      }
    })
    .catch(err => {   
      showError(`Unable to login - ${err.message}`);  
      console.error(err.message);
    });
  })

}

function saveLink(httpMethod, url, category = null, linkId = null, title = null, note = null) {
  hideError();
  return new Promise((resolve, reject) => {    
    if (!sessionStorage.getItem('jwt')) {
      console.error('You must be logged in to save a link');
      showLogin();
      throw new Error('You  must be logged in to save a link. Please log in below.');
    }
    const token = sessionStorage.getItem('jwt');    
    fetch(`api/links/${linkId || ''}`, {
        method: httpMethod,
        headers: new Headers({
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }),
        body: JSON.stringify({
          url,
          category,
          title,
          note
        })
      })
      .then(res => {
        if (!res.ok) {
          throw new Error ('Unable to save link. Please try again');
        }        
        return res.json()
      })
      .then(resJson => {       
        resolve(resJson);
      })
      .catch(err => {
        console.error(err);        
        reject({message: err.message});
      })
  });
}

function saveCategory(httpMethod, name, categoryId = null) {
  hideError();
  return new Promise((resolve, reject) => {    
    if (!sessionStorage.getItem('jwt')) {
      console.error('You must be logged in to save a link');
      showLogin();
      throw new Error('You  must be logged in to save a link. Please log in below.');
    }
    const token = sessionStorage.getItem('jwt');    
    fetch(`api/categories/${categoryId || ''}`, {
        method: httpMethod,
        headers: new Headers({
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }),
        body: JSON.stringify({
          name
        })
      })
      .then(res => {
        if (!res.ok) {
          throw new Error ('Unable to save category. Please try again');
        }        
        return res.json()
      })
      .then(resJson => {       
        resolve(resJson);
      })
      .catch(err => {
        console.error(err);        
        reject({message: err.message});
      })
  });
}

 // user presmumably got here via entering link to save in URL bar and hit enter
 // This is only called on $() ready
function getUrlToSave(url = null) { 
  let category = null;
  let path = null;
  const urlParams = new URLSearchParams(window.location.search);  
  const qryString = urlParams.toString();
  if (qryString && qryString.indexOf('saveLink') > -1) {
  
   const qryParam = urlParams.get('saveLink');

   const split = qryParam.split('--');    
    if (split.length > 1) {
        category = decodeURIComponent(split[0].replace(/^\/+/g, ''));
        path = decodeURIComponent(split[1]);
    } else {       
        category = 'none';
        path = decodeURIComponent(split[0].replace(/^\/+/g, ''));
    }    
    if (!validUrl(path)) {
      console.error('Invalid url');
      showError('Invalid url');
    } else {
     sessionStorage.setItem('category', category);
     sessionStorage.setItem('urlToSave', path);    
    }
  } else {
    sessionStorage.removeItem('category');
    sessionStorage.removeItem('urlToSave');
  }
}

function createLinkOnLoad() {
  return new Promise((resolve, reject) => {
    // Only execute if user is logged in when the page loads.
    // Otherwise, user needs to log in and the link in the query param will be saved 
    // upon a successful login
    if (!isLoggedIn) return resolve();    

    const url = sessionStorage.getItem('urlToSave');   
    if (url) {
      saveLink('POST', url, sessionStorage.getItem('category'))
        .then((link) => {        
          //clear out sessionStorage
          clearLinkToSave();
          resolve();
        })
        .catch(err => {
          console.error(err);          
          reject(err);
        });
    } else { 
      resolve();
    }
  });
}

function clearLinkToSave() {
  sessionStorage.removeItem('category');
  sessionStorage.removeItem('urlToSave');
  // remove query string params
  history.pushState({}, "", "/");
}

function showError(errorText) {
  $('.js-error').html(errorText);
  $('.js-error').fadeIn('slow');
}

function hideError() {
  $('.js-error').html('');
  $('.js-error').hide();
}

function showStartup() { 
  if (!isLoggedIn()) {    
    showLogin();        
  } else {   
    showLinks();    
  }
}

function isLoggedIn() {   
  return !!sessionStorage.getItem('jwt');
}

function showLogin() {
  showSection('js-login-container');  
}

function getLinks() {
  return new Promise((resolve, reject) => {
    if (!isLoggedIn) return [];
    const token = sessionStorage.getItem('jwt');
    fetch('api/links', {
        method: 'GET',
        headers: new Headers({
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }),
      })
      .then(res => res.json())
      .then(resJson => {       
        state.links = resJson.data;
        //state.categories = getCategories();
        resolve(resJson.data)
      })
      .catch(err => {
        console.error(err);
        reject(err);
      });
  })
}

function getCategories(links) {
  return new Promise((resolve, reject) => {
    if (!isLoggedIn) return [];
    const token = sessionStorage.getItem('jwt');
    fetch('api/categories', {
        method: 'GET',
        headers: new Headers({
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }),
      })
      .then(res => res.json())
      .then(resJson => {               
        const sortedCategories = resJson.data.sort((a, b) => a.name < b.name ? -1 : (a.name > b.name) ? 1 : 0);              
        resolve(sortedCategories);
      })
      .catch(err => {
        console.error(err);
        reject(err);
      });
  })
}

//validates a given url
function validUrl(url) { 
  const urlRegEx = /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+){0,}\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/g
  const result = url.match(urlRegEx);
  return !result || result.length < 1 ? false : true;
}

function displayLinks(links, category = null) { 
  hideError();
  if (!links || links.length < 1) {    
    $('.js-links-container').html('');
   return showError('No Links to display')
  }
  let strHtml = '';  
  if (category) {
    strHtml += `<h2>${category}</h2>`
  }
  strHtml += links.map(link => {
    const title = link.title || link.url;   
    const favIcon = link.favIcon || '/images/default-icon.png'; 
    return `<div class="link-row">
    <div class="favicon"><img src=${favIcon}></div>
    <div class="url-text"><a href="${link.url}">${title}</a></div>
    <div class="link-row__button-row">
      <button class="btn btn-primary link-row__button js-btn-edit js-btn-edit-link" data-id="${link._id}" data-mode="edit">Edit</button>
      <button class="btn btn-primary link-row__button js-btn-delete js-btn-delete-link" data-id="${link._id}" data-mode="delete">Delete</button>
      </div>
  </div>`
  }).join('\n');
  $('.js-links-container').html(strHtml);
  showLinksSection();
}

function displayCategories(categories = null) {
  if (!categories) categories = state.categories; 
  let strHtml = `<h2>Categories</h2>`;
  strHtml += categories.map(category => {
    const title = category.name
    return `<div class="link-row">       
    <div class="url-text js-category-text">${category.name}</div>
    <div class="link-row__button-row">
      <button class="btn btn-primary link-row__button js-btn-edit js-btn-edit-category" data-id="${category._id}" data-mode="edit">Edit</button>
      <button class="btn btn-primary link-row__button js-btn-delete js-btn-delete-category" data-id="${category._id}" data-mode="delete">Delete</button>
      </div>
  </div>`
  }).join('\n');
  $('.js-categories-container').html(strHtml);
  showSection('js-categories-container');
}

function showLinks() {
  let links;
  getLinks()
  .then(tmpLinks => {
    links = tmpLinks;
    return getCategories()
  })  
  .then((categories) => {
    state.categories = categories;
    displayLinks(links, null, true);  
    // show search textbox
    $('.js-search-text').show();  
  })
  .catch(err => {
    showError(`Unable to get links for display - ${err.message}`);
  });
}

function modifyButtonsHandler() {
  // Attach a delegated event handler
  $( '.js-links-container' ).on( "click", "button", function( event ) {    
    event.preventDefault();
    var elem = $( this );      
    const className = elem[0].className; 
    
    if (elem.data('mode') === 'edit') {      
        showEditLinkForm(elem.data('id'));     
    } else if (elem.data('mode') === 'delete') {     
        deleteLink(elem.data('id'));         
    }
  });

  $( '.js-categories-container' ).on( "click", "button", function( event ) {    
    event.preventDefault();
    var elem = $( this );      
    const className = elem[0].className;     
    if (elem.data('mode') === 'edit') {
        showEditCategoryForm(elem.data('id'));
    } else if (elem.data('mode') === 'delete') {
        deleteCategory(elem.data('id'));    
    }
  });
}

function showEditAddLinkForm(link = null) {      

  const form = $('.js-edit-add-form');
  let categoryOptions = '';
  let linkCategory = '';  
  let header = 'Add a New Link';

  if (link) {
    header = 'Edit Link'
    form.find('#title').val(link.title);
    form.find('#url').val(link.url);
    form.find('#note').val(link.note);
    // when getLinks is initially called, category comes back as an object.
    // On updates, only the _id of the category gets sent back
    linkCategory = link.category._id || link.category;    
  }  

  categoryOptions += state.categories.map(category => {       
    return `<option value="${category._id}"${linkCategory === category._id ? ' selected ' : ''}>${category.name}</option>`
  }).join('\n');    

  // If no link parameter is present, user is adding a new link.
  // We need to add a default if 'none' is not already present in the list of categories for this user
  if (!link) {
    const noneCategory = state.categories.find(category => category.name.toLowerCase() === 'none');
    if (!noneCategory) {
      categoryOptions += `<option value="none" ${!link ? ' selected ' : ''}>none</option>`
    }
  }

  form.find('#category').html(categoryOptions);
  $('.js-add-edit-link-header').text(header);

  //show the form
  showSection('js-edit-add-container');
}

function showEditAddCategoryForm(category = null) {   

  const form = $('.js-edit-add-category-form');  

  if (category) {
    $('.js-edit-add-category-header').text('Edit Category');
    form.find('#name').val(category.name);      
  }  else {
    $('.js-edit-add-category-header').text('Add Category');
    form.find('#name').val('');    
  }    
  showSection('js-edit-add-category-container');  
}

function showSection(className) {
  hideError();
  // show the section selected in the master container, and hide the rest
  const sections = $('.master-container').children('section');   
  sections.each(function (index) {
   if (this.className.includes(className)) {
     $(this).fadeIn();
   } else {
    $(this).hide();
   }
   // show the search bar if we're showing the links section
   className === 'js-links-container' ? $('.js-search-container').fadeIn() : $('.js-search-container').hide();
  })
}

function showEditLinkForm(id) { 
  const linkToEdit = state.links.find(link => link._id === id);
  $('.js-edit-add-form').find('#mode').val('edit');
  $('.js-edit-add-form').find('#linkId').val(linkToEdit._id); 
  showEditAddLinkForm(linkToEdit);
}

function showAddLinkForm() {
  $('.js-edit-add-form').find('#mode').val('add');
  $('.js-edit-add-form').find('#title').val('');
  $('.js-edit-add-form').find('#url').val('');
  $('.js-edit-add-form').find('#note').val('');
  $('.js-edit-add-form').find('#category').val('');
  $('.js-edit-add-form').find('#linkId').val(''); 
  showEditAddLinkForm();  
}

function showLinksSection() {
  showSection('js-links-container'); 
}

function watchEditAddCategoryForm() {
  $('.js-edit-add-category-form').submit(function (e) {
    e.preventDefault();
    hideError();
    const name = $(this).find('#name').val();;
    const mode = $(this).find('#mode').val();
    const categoryId = $(this).find('#categoryId').val();
    let httpMethod = null;
    if (mode === 'edit') {
      httpMethod = 'PUT';
    } else if (mode === 'add') {
      httpMethod = 'POST';
    }       
    saveCategory(httpMethod, name, categoryId)
    .then(res => {     
      updateCategoryStateAfterSave(res.data);
      displayCategories(state.categories);     
    })
    .catch(err => {
      showError(`Unable to save category - ${err.message}`);
    });
  });

}

function showEditCategoryForm(id) { 
  const catToEdit = state.categories.find(cat => cat._id === id);
  $('.js-edit-add-category-form').find('#mode').val('edit');
  $('.js-edit-add-category-form').find('#categoryId').val(catToEdit._id); 
  showEditAddCategoryForm(catToEdit);
}

function showAddCategoryForm(id) {   
  $('.js-edit-add-category-form').find('#mode').val('add');
  $('.js-edit-add-category-form').find('#categoryId').val(''); 
  showEditAddCategoryForm();
}

function watchEditAddLinkForm() {
  $('.js-edit-add-form').submit(function (e) {
    hideError();   
    e.preventDefault();    
    const title = $(this).find('#title').val();
    const url = $(this).find('#url').val();
    const note = $(this).find('#note').val();
    const category = $(this).find('#category').val();
    const mode = $(this).find('#mode').val();
    const linkId = $(this).find('#linkId').val();
    let httpMethod = null;
    if (mode === 'edit') {
      httpMethod = 'PUT';
    } else if (mode === 'add') {
      httpMethod = 'POST';
    }      
    saveLink(httpMethod, url, category, linkId, title, note)
    .then(res => {
      updateLinksState(res.data);
      displayLinks(state.links);      
    })
    .catch(err => {
      showError(`Unable to save link - ${err.message}`);
    });
  });
}

function updateLinksState(link) {  
  const index  = state.links.findIndex(search => search._id === link._id)
  if (index > -1) {
    state.links[index] = link;
  } else { // user has just added a new record, add it to beginning of state
    state.links.unshift(link);
  }
}

function updateCategoryStateAfterSave(category) {  
  const index  = state.categories.findIndex(search => search._id === category._id)
  if (index > -1) {
    state.categories[index] = category;
  } else { // user has just added a new record, add it to state
    state.categories.push(category);
  }
}

function deleteLink(id) {

  if (!confirm('Are you sure you want to delete this link?')) return;

  const token = sessionStorage.getItem('jwt');
  fetch(`api/links/${id}`, {
      method: 'DELETE',
      headers: new Headers({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }),
    })   
    .then((res) => {
      if (res.status !== 204) {
        throw new Error('Unable to delete link');
      }
      const delIndex = state.links.findIndex(link => link._id === id);
      if (delIndex > -1) {
        state.links.splice(delIndex, 1);
        displayLinks(state.links);
      } else {
        throw new Error ('Could not find link to delete');
      }
    })
    .catch(err => {
      console.error(err.message);
      showError('Unable to delete link.');
    })
}

function deleteCategory(id) {
  hideError();

  if (!confirm('Are you sure you want to delete this category?')) return;

  const token = sessionStorage.getItem('jwt');
  fetch(`api/categories/${id}`, {
      method: 'DELETE',
      headers: new Headers({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }),
    })   
    .then((res) => {
      return res.json()
    .then(resJson => {        
        if (res.status !== 200) {         
          throw new Error(resJson.message);
        }
        const delIndex = state.categories.findIndex(category => category._id === id);
        if (delIndex > -1) {
          state.categories.splice(delIndex, 1);
          displayCategories(state.categories);
        } else {
          throw new Error ('Could not find category to delete');
        }
      })     
    })
    .catch(err => {
      console.error(err.message);
      showError(err.message);
    })
}

function addNewCategoryHandler() {
  $('.js-new-category').click(function(e) { 
    isLoggedIn() ? showAddCategoryForm() : showLogin();
  });
}

function showCategoriesHandler() {
  $('.js-show-categories').click(function(e) {
    isLoggedIn() ? displayCategories(state.categories) : showLogin();;
  });
}

function showCategoryLinksHandler() {  
  // attach delegated event handler
  $('.js-categories-container').on('click', '.js-category-text', function(event) {
    event.preventDefault();    
    const category = state.categories.find(category => category.name === $(this).text());
    const links = state.links.filter(link => {     
      return link.category === category._id || link.category._id === category._id;
    })
   displayLinks(links, category.name);
  })
}

function searchLinksHandler() {
  $('.js-search-container').on('keyup', '.js-search-text', function(event) {    
    const searchString = $(this).val().toLowerCase();
    
    //show all links if no search string
    if (!searchString) return displayLinks(state.links);

    const links = state.links.filter(link => link.title.toLowerCase().includes(searchString) || link.url.toLowerCase().includes(searchString));    
    displayLinks(links);
  })
}

function initApp() {   
  getUrlToSave();
  setupMenu();
  watchLoginForm();
  watchEditAddLinkForm(); 
  watchEditAddCategoryForm(); 
  addNewCategoryHandler();
  showCategoriesHandler();
  showCategoryLinksHandler();
  modifyButtonsHandler();  
  searchLinksHandler();
  createLinkOnLoad()
  .then(() => {   
    showStartup();
  })
  .catch(err => {   
    showError(err.message);
  })
}

$(initApp);
