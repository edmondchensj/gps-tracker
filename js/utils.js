var setInnerHTMLWithJS = function(div_id, html) {
    // Set inner HTML and run any script tags 
    const elm = document.getElementById(div_id);
    elm.innerHTML = html;
    Array.from(elm.querySelectorAll("script")).forEach( oldScript => {
      const newScript = document.createElement("script");
      Array.from(oldScript.attributes)
        .forEach( attr => newScript.setAttribute(attr.name, attr.value) );
      newScript.appendChild(document.createTextNode(oldScript.innerHTML));
      oldScript.parentNode.replaceChild(newScript, oldScript);
    });
  }

const goToPage = async function (routeKey) {
  const routes = {"home": "/pages/home-screen.html",
                  "login": "/pages/login.html",
                  "admin": "/pages/admin.html"}
  const html = await fetch(routes[routeKey]).then((data) => data.text());

  setInnerHTMLWithJS("main", html);
}

const busPlateStorageKey = "bus-plate";

const setBusPlate = function (plateNumber) {
    localStorage.setItem(busPlateStorageKey, plateNumber);
}

const clearBusPlate =  function () {
  localStorage.removeItem(busPlateStorageKey);
}

function getBusPlate() {
  const savedBusPlate = localStorage.getItem(busPlateStorageKey);
  return savedBusPlate;
}

function getCurrentISOTime() {
  // Return ISO-8601 time format (required for AWS Location batch update)
  const date = new Date();
  const timestamp = date.toISOString();
  return timestamp;
}

function convertToISOTime(timestamp) {
  const timestampLocal = new Date(timestamp);
  const timestampISO = timestampLocal.toISOString();
  return timestampISO;
}

function addTime(timestamp, numMinutes) {
  // Takes in a timestamp (epoch) and number of hours to add, then 
  // Return new timestamp 
  var date = new Date(timestamp);
  date.setMinutes(date.getMinutes() + numMinutes);
  return date;
}

function getTimeDiffInSeconds(isoTime1, isoTime2) {
  // Get time difference in seconds between two iso timestamps
  var d1 = new Date(isoTime1);
  var d2 = new Date(isoTime2);
  const diff = Math.abs(d2 - d1);
  return Math.floor(diff/1e3);
}

async function setScreenWakeLock() {
  // Checks whether browser has wake-lock function and triggers wakelock if available
  // Wake-lock alert messages are commented out as iOS devices do not support wake-lock

  const wakeLockDiv = document.getElementById("wake-lock-alert");
  var isSupported = false;

  // Check browser compatibility 
  if ('wakeLock' in navigator) {
    console.log("Wake lock supported");
    isSupported = true;
  } else {
    console.log("Wake lock not supported");
    // wakeLockDiv.innerHTML = `
    //   <div class="alert alert-danger text-center">This browser does not support Wake-lock and may result in the app going to sleep. <br>Please use a different browser (Recommended: Chrome).</div>
    // `;
  }
  
  if (isSupported) {
    // Enable wake-lock
    let wakeLock = null;

    // Request a wake lock
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      console.log('Wake Lock enabled!');
    } catch (err) {
      // The Wake Lock request has failed - usually system related, such as battery.
      console.log("Error occurred while enabling wake-lock: ", err)
      // wakeLockDiv.innerHTML = `
      //   <div class="alert alert-danger text-center">An error occurred when enabling wake-lock. Please make sure the device is charging. </div>
      // `;
    }

    // Create listener to re-activate wake-lock if visibility of page changed (inactive to active) and wake-lock was released for some reason
    document.addEventListener('visibilitychange', async () => {
      if (wakeLock !== null && document.visibilityState === 'visible') {
        console.log("Re-activating wakelock");
        wakeLock = await navigator.wakeLock.request('screen');
      }
    });
  }
}
export { setInnerHTMLWithJS, goToPage, setBusPlate,
   clearBusPlate, getBusPlate, getCurrentISOTime, 
   setScreenWakeLock, convertToISOTime, addTime, getTimeDiffInSeconds };