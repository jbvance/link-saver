

function setupMenu() {
  let mainNav = document.getElementById("js-menu");
  let navBarToggle = document.getElementById("js-navbar-toggle");

  navBarToggle.addEventListener("click", function () {
    mainNav.classList.toggle("active");
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
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
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


function initApp() {
  setupMenu();
  watchForm();
}

$(initApp);