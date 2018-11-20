const state = {  
  links: []
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
        })
        .catch(err => { throw new Error( err.message )});
      }
    })
    .catch(err => {   
      $('.js-error').text(err.message);;
      $('.js-error').show();  
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
  console.log("createLinkOnLoad");
  const url = sessionStorage.getItem('urlToSave');
  console.log("url", url);
  if (url) {
    saveLink(url, sessionStorage.getItem('category'))
    .then((link) => {
      console.log("LINK", link.data);
      state.links.push(link.data);
      //clear out sessionStorage
      clearLinkToSave();
    })
    .catch(err => {
      console.error(err);   
      showError(err);   
    })
  }
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

function showLoggedIn() {
  if (!isLoggedIn()) {
    $('.js-login-container').show();
    $('.js-links-container').hide();
  } 
}

function isLoggedIn() {   
  return !!sessionStorage.getItem('jwt');
}


function getLinks() {
  return new Promise((resolve, reject) => {
    if (!isLoggedIn) return '';
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
  console.log('In displayLinks');
  const strHtml = links.map(link => {
    const title = link.title || link.url;   
    const favIcon = link.favIcon || '/images/default-icon.png'; 
    return `<div class="link-row">
    <div class="favicon"><img src=${favIcon}></div>
    <div class="url-text"><a href="${link.url}">${title}</a></div>
    <div><button class="btn btn-primary js-btn-edit" data-id="${link._id}">Edit</button></div>
  </div>`
  }).join('\n');
  $('.js-links-container').html(strHtml);
}

function initApp() {
  showLoggedIn();
  getUrlToSave();
  createLinkOnLoad();
  setupMenu();
  watchLoginForm();
  getLinks()
  .then(links => displayLinks(links));
}

$(initApp);
