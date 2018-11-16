

function setupMenu() {
  let mainNav = $('#js-menu');
  let navBarToggle = $('#js-navbar-toggle');

  navBarToggle.click(function() {
    mainNav.toggleClass('active');
  });
}


function watchForm() {
  
  $('.js-form-login').submit(function(e) {
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
      sessionStorage.setItem('jwt', json.authToken);
    })
    .catch(err => {     
      console.log(err.message);
    })
  })

}

 // user presmumably got here via entering link to save in URL bar and hit enter
 // only called on $() ready
function getSaveUrl(url = null) {
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
     saveLink(path, category);
    }
  }
}

function isLoggedIn() {
  console.log(sessionStorage.getItem('jwt'));
}

function saveLink(url, category = 'none') {
  if (!sessionStorage.getItem('jwt')) {
    return console.error('You must be logged in to save a link');
  }
  console.log("URL", url, "CATEGORY", category);
}

//validates a given url
function validUrl(url) { 
  const urlRegEx = /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+){0,}\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/g
  const result = url.match(urlRegEx);
  return !result || result.length < 1 ? false : true;
}



function initApp() {
  getSaveUrl();
  //console.log(window.location.pathname); 
  setupMenu();
  watchForm();
}

$(initApp);