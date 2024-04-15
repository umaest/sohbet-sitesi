const $ = query => document.querySelector(query)
const imp1 = $("#ad")
const imp2 = $("#oda")
const bttn = $("#loginBtn")
imp2.focus()
function butonControl() {
    if (imp1.value.length >= 3 && imp2.value.length >= 3) {
        bttn.disabled = false
    } else {
        bttn.disabled = true
    }
}
butonControl()
function checkEnter(event, inpt) {
    if (event.key === "Enter") {
      event.preventDefault();
      inpt ? bttn.click():imp1.focus();
    }
  }