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
        'MY-HEADER': 'https://www.foxnews.com'
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
        saveLink(sessionStorage.getItem('urlToSave'), sessionStorage.getItem('category'))
        .then(() => {
          clearLinkToSave();
          showLinks();
        })
        .catch(err => { throw new Error( err.message )});
      }
    })
    .catch(err => {   
      showError(`Unable to login - ${err.message}`);  
      console.error(err.message);
    });
  })

}

function saveLink(url, category) {
  hideError();
  return new Promise((resolve, reject) => {
    console.log('saveLink');
    if (!sessionStorage.getItem('jwt')) {
      console.error('You must be logged in to save a link');
      return reject('You  must be logged in to save a link. Please log in below.');
    }
    const token = sessionStorage.getItem('jwt');
    fetch('api/links', {
        method: 'POST',
        headers: new Headers({
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }),
        body: JSON.stringify({
          url,
          category
        })
      })
      .then(res => res.json())
      .then(resJson => {
        console.log("RETURN", resJson);
        resolve(resJson);
      })
      .catch(err => {
        console.error(err);
        showError(err.message);
        reject(err);
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
      saveLink(url, sessionStorage.getItem('category'))
        .then((link) => {
          console.log("LINK", link.data);
          //clear out sessionStorage
          clearLinkToSave();
          resolve();
        })
        .catch(err => {
          console.error(err);
          showError(err);
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
        state.categories = getCategories(state.links);
        resolve(resJson.data)
      })
      .catch(err => {
        console.error(err);
        reject(err);
      });
  })
}

function getCategories(links) {
  const tmp = [];
  links.forEach(link => {
   const category = tmp.find(cat => cat._id === link.category._id);
   if (!category) {
    tmp.push(link.category);
   }   
  });
  console.log("CATEGORIES", tmp);
  return tmp;
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
    <div>
      <button class="btn btn-primary js-btn-edit" data-id="${link._id}" data-mode="edit">Edit</button>
      <button class="btn btn-primary js-btn-delete" data-id="${link._id}" data-mode="delete">Delete</button>
      </div>
  </div>`
  }).join('\n');
  $('.js-links-container').html(strHtml);
}

function showLinks() {
  getLinks()
  .then(links => {
    displayLinks(links)
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
      console.log('DELETE MODE');
    }
  });
}

function showEditAddForm(link = null) {   
  $('.js-links-container').hide();
  $('.js-login-container').hide();
  $('.js-edit-add-container').show();

  const form = $('.js-edit-add-form');
  let linkCategory = '';
  if (link) {
    form.find('#title').val(link.title);
    form.find('#url').val(link.url);
    form.find('#notes').val(link.notes);
    linkCategory = link.category._id;    
  }

  //console.log("state.categories", state.categories);
  const categories = state.categories.map(category => {
    return `<option value="${category._id}"${linkCategory === category._id ? ' selected ' : ''}>${category.name}</option>`
  }).join('\n');  
  form.find('#categories').html(categories);
}

function showLinksDiv() {  
  $('.js-login-container').hide();
  $('.js-edit-add-container').hide();
  $('.js-links-container').show();
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
    console.log($('.js-edit-add-container').html());
    const title = $(this).find('#title').val();
    const url = $(this).find('#url').val();
    const notes = $(this).find('#notes').val();
    const mode = $(this).find('#mode').val();
    console.log('MODE', mode);    
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
    console.log("DONE")
    showStartup();
  })  
}

$(initApp);
