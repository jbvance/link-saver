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
        console.log("RETURN JSON", resJson);
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
        console.log("GOT HERE", split[0].replace(/^\/+/g, ''));
        category = 'none';
        path = decodeURIComponent(split[0].replace(/^\/+/g, ''));
    }
    console.log("CAT", category, "PATH", path);
    if (!validUrl(path)) {
      console.error('Invalid url');
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
    console.log("url", url);
    if (url) {
      saveLink('POST', url, sessionStorage.getItem('category'))
        .then((link) => {
          console.log("LINK", link.data);
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
  $('.js-links-container').hide();
  $('.js-edit-add-container').hide();
  $('.js-login-container').show();
  
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
        console.log("LINKS", resJson);
        state.links = resJson.data;
        state.categories = getCategories();
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
        console.log("CATEGORIES", resJson);
        state.categories = resJson.data;        
        resolve(resJson.data)
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

function displayLinks(links) { 
  const strHtml = links.map(link => {
    const title = link.title || link.url;   
    const favIcon = link.favIcon || '/images/default-icon.png'; 
    return `<div class="link-row">
    <div class="favicon"><img src=${favIcon}></div>
    <div class="url-text"><a href="${link.url}">${title}</a></div>
    <div class="link-row__button-row">
      <button class="btn btn-primary link-row__button js-btn-edit" data-id="${link._id}" data-mode="edit">Edit</button>
      <button class="btn btn-primary link-row__button js-btn-delete" data-id="${link._id}" data-mode="delete">Delete</button>
      </div>
  </div>`
  }).join('\n');
  $('.js-links-container').html(strHtml);
}

function showLinks() {
  let links;
  getLinks()
  .then(tmpLinks => {
    links = tmpLinks;
    return getCategories()
  })  
  .then(() => {
    displayLinks(links);
    showLinksDiv();
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
    if (elem.data('mode') === 'edit') {
      showEditForm(elem.data('id'));
    } else if (elem.data('mode') === 'delete') {
      deleteLink(elem.data('id'));
    }
  });
}

function showEditAddForm(link = null) {   
  $('.js-links-container').hide();
  $('.js-login-container').hide();
  $('.js-edit-add-container').fadeIn();

  const form = $('.js-edit-add-form');
  let categoryOptions = '';
  let linkCategory = '';

  if (link) {
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
}

function showLinksDiv() {  
  $('.js-login-container').hide();
  $('.js-edit-add-container').hide();
  $('.js-links-container').fadeIn();
}
 
function showEditForm(id) { 
  const linkToEdit = state.links.find(link => link._id === id);
  $('.js-edit-add-form').find('#mode').val('edit');
  $('.js-edit-add-form').find('#linkId').val(linkToEdit._id);
  console.log('linkToEdit', linkToEdit);
  showEditAddForm(linkToEdit);
}

function showAddForm() {
  $('.js-edit-add-form').find('#mode').val('add');
  showEditAddForm();  
}

function watchEditAddForm() {
  $('.js-edit-add-form').submit(function (e) {
    hideError();
    console.log("SUBMIT");
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
    console.log('MODE', mode);   
    saveLink(httpMethod, url, category, linkId, title, note)
    .then(res => {
      updateLinkStateAfterSave(res.data);
      displayLinks(state.links);
      showLinksDiv();
    })
    .catch(err => {
      showError(`Unable to save link - ${err.message}`);
    });
  });
}

function updateLinkStateAfterSave(link) {
  console.log("LINK TO CHANGE", link);
  const index  = state.links.findIndex(search => search._id === link._id)
  if (index > -1) {
    state.links[index] = link;
  } else {
    console.error('Unable to locate link in state for update');
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

function initApp() {  
  getUrlToSave();
  setupMenu();
  watchLoginForm();
  watchEditAddForm();  
  modifyButtonsHandler();
  createLinkOnLoad()
  .then(() => {   
    showStartup();
  })
  .catch(err => {
    console.log("CATCHING ERROR", err);
    showError(err.message);
  })
}

$(initApp);
