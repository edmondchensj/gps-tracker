var setInnerHTMLWithJS = function(elm, html) {
    // Set inner HTML and run any script tags 
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
                  "select-bus": "/pages/select-bus.html"}
  const html = await fetch(routes[routeKey]).then((data) => data.text());
  const main = document.getElementById("main");
  setInnerHTMLWithJS(main, html);
}

const busPlateStorageKey = "bus-plate";

const setBusPlate = function (plateNumber) {
    // Set bus plate text in HTML div and save to local storage
    document.getElementById("bus-plate").textContent = plateNumber;
    localStorage.setItem(busPlateStorageKey, plateNumber);
}

const clearBusPlate =  function () {
  localStorage.removeItem(busPlateStorageKey);
}

function getBusPlate() {
  const savedBusPlate = localStorage.getItem(busPlateStorageKey);
  console.log("getbusplate: ", savedBusPlate);
  return savedBusPlate;
}

function getCurrentISOTime() {
  // Return ISO-8601 time format (required for AWS Location batch update)
  const date = new Date();
  const timestamp = date.toISOString()
  console.log("timestamp: ", timestamp)
  return timestamp
}
export { setInnerHTMLWithJS, goToPage, setBusPlate, clearBusPlate, getBusPlate, getCurrentISOTime };