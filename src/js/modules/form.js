export function form() {
	const form = {
		form: document.querySelector('.form'),
		email: document.getElementById('email'),
		password: document.getElementById('password'),
		submitBtn: document.getElementById('button')
	}

	form.email.oninput = (evt) => {
		const emailInputValue = evt.target.value;
		if (emailInputValue) {
			form.email.classList.add('filled');
		} else {
			form.email.classList.remove('filled');
		}
	}

	form.password.oninput = (evt) => {
		const emailInputValue = evt.target.value;
		if (emailInputValue) {
			form.password.classList.add('filled');
		} else {
			form.password.classList.remove('filled');
		}
	}

	form.form.addEventListener("submit", () => {
		if (form.email.value === "mail@m.com" && form.password.value === "password") {
			alert("Вы вошли!!!");
		} else {
			alert("Неправильно введены email и пароль");
		}
	});
}