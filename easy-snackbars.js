/*
* Easy Snackbars JS
* Lightweight library to add snackbars to your websites and webapps
* (last update: 2026-03-04)
* By Marc Robledo https://www.marcrobledo.com
* Documentation and sourcecode: https://www.marcrobledo.com/easy-snackbars-js
*
* License:
*
* MIT License
* 
* Copyright (c) 2014-2026 Marc Robledo
* 
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
* 
* The above copyright notice and this permission notice shall be included in all
* copies or substantial portions of the Software.
* 
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
* SOFTWARE.
*/

const EasySnackbars = (function () {
	/* default options */
	const _defaults = {
		closeDelay: 5000
	};




	/* common functions */
	const _evtCheckFadeTransition = function (evt) {
		if (evt.propertyName === 'opacity')
			this._fades = true;
	}
	const _appendElementAndOpen = function (container, element, onOpen) {
		if (typeof window.requestAnimationFrame === 'function') {
			element._fades = false;
			element.addEventListener('transitionstart', _evtCheckFadeTransition);
			_openElementAfterBeingAdded(element, 12, onOpen);
		} else {
			element.className += ' show';
			if (typeof onOpen === 'function')
				onOpen(element);
		}
		container.appendChild(element);
	}
	const _openElementAfterBeingAdded = function (element, remainingFrames, onOpen) {
		window.requestAnimationFrame(function () {
			remainingFrames--;
			if (remainingFrames === 0) {
				element.className += ' show';
				if (typeof onOpen === 'function')
					onOpen(element);
			} else {
				_openElementAfterBeingAdded(element, remainingFrames, onOpen);
			}
		});
	};







	/* component: snackbars */
	const _snackbarQueue = [];
	const snackbarContainer = document.createElement('div');
	snackbarContainer.id = 'container-snackbars';

	const _snackbarClose = function (snackbar) {
		if (snackbar.closeTimeout)
			clearTimeout(snackbar.closeTimeout);


		if (typeof window.requestAnimationFrame === 'function' && snackbar._fades) {
			snackbar.removeEventListener('transitionstart', _evtCheckFadeTransition);
			snackbar.addEventListener('transitionend', function (evt) {
				if (evt.propertyName === 'opacity') {
					if(snackbar.parentElement) // check if snackbar is still in the DOM, it could have been removed by another close event
						snackbar.parentElement.removeChild(snackbar);
					_consumeSnackbarQueue();
				}
			});
			snackbar.className = snackbar.className.replace(' show', '');
		} else {
			snackbar.parentElement.removeChild(snackbar);
			_consumeSnackbarQueue(snackbar);
		}
	}

	const _evtMouseEnterSnackbar = function () {
		if (this.closeTimeout)
			clearTimeout(this.closeTimeout);
	};

	const _consumeSnackbarQueue = function () {
		if (snackbarContainer.children.length) {
			_snackbarClose(snackbarContainer.children[0]);
			return false;
		}

		if (!_snackbarQueue.length)
			return false;

		const snackbarOptions = _snackbarQueue.shift();


		/* build snackbar */
		const snackbar = document.createElement('div');
		snackbar.className = snackbarOptions.class;

		const snackbarLabel = document.createElement('div');
		snackbarLabel.innerHTML = snackbarOptions.label;
		snackbarLabel.className = 'snackbar-body';
		snackbar.appendChild(snackbarLabel);


		if (snackbarOptions.btn) {
			const buttonContainer = document.createElement('div');
			const btn = document.createElement('button');
			btn.type = 'button';
			btn.addEventListener('click', function (evt) {
				evt.stopPropagation();
				snackbarOptions.btn.callback();
				_consumeSnackbarQueue();
			});
			btn.className = 'snackbar-btn';
			btn.innerHTML = snackbarOptions.btn.label;
			buttonContainer.appendChild(btn);
			snackbar.appendChild(buttonContainer);
		}

		if (snackbarOptions.closable) {
			const closeButton = document.createElement('button');
			closeButton.className = 'snackbar-btn-close';
			closeButton.addEventListener('click', function () { _snackbarClose(snackbar); });
			snackbar.appendChild(closeButton);
		}



		/* initialize timeout */
		snackbar.resetCloseTimeout = function () {
			if (this.closeTimeout)
				clearTimeout(this.closeTimeout);
			this.closeTimeout = window.setTimeout(function () { _snackbarClose(snackbar); }, snackbarOptions.closeDelay);
		};
		snackbar.resetCloseTimeout();


		/* add mouse events */
		snackbar.addEventListener('mouseenter', _evtMouseEnterSnackbar);
		snackbar.addEventListener('mouseleave', snackbar.resetCloseTimeout);




		/* add snackbar to container */
		_appendElementAndOpen(snackbarContainer, snackbar);
	}



















	window.addEventListener('load', function () {
		document.body.appendChild(snackbarContainer);
	});



	return {
		open: function (text, settings) {
			if (typeof text !== 'string')
				throw new TypeError('no snackbar text provided');


			const snackbarSettings = {
				label: text,
				class: 'snackbar',
				closeDelay: _defaults.closeDelay,
				closable: null,
				btn: null
			};

			/* shorthands */
			if (typeof settings === 'string') {
				if (settings === 'closable') {
					settings = { closable: true };
				} else {
					settings = { class: settings };
				}
			} else if (typeof settings === 'number') {
				settings = { closeDelay: settings };
			} else if (settings === true) {
				settings = { closable: true };
			}

			/* parse settings */
			if (typeof settings === 'object') {
				if (typeof settings.class === 'string'){
					settings.class = settings.class.replace(/[^0-9a-zA-Z_\- ]/g, '').trim();
					if(settings.class)
						snackbarSettings.class = 'snackbar snackbar-' + settings.class;
				}

				if (typeof settings.closeDelay === 'number' && settings.closeDelay >= 200)
					snackbarSettings.closeDelay = Math.floor(settings.closeDelay);

				if (typeof settings.closable !== 'undefined') {
					snackbarSettings.closable = !!settings.closable;
				}
				if (typeof settings.btnCallback === 'function') {
					snackbarSettings.btn = {
						label: typeof settings.btnLabel === 'string' ? settings.btnLabel : 'Action',
						callback: settings.btnCallback
					};
				}
			}

			_snackbarQueue.push(snackbarSettings);

			/* consume snackbar queue */
			_consumeSnackbarQueue();
		},
		close: _consumeSnackbarQueue
	}
})();