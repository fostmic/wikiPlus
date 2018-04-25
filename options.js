var oldMaxNumber = null; //saves previous entry in the maximum number of pages numeric input
var oldMaxDays = null; //saves previous entry in the maximum number of days numeric input


//called when numeric text input gets focus
function oldNumberSaver(e)
{
	console.log("entering oldNumberSaver");
	var intValue = parseInt(e.target.value, 10);

	if (isNaN(intValue) == false)
	{
		console.log("oldNumberSaver got a good number");

		if (e.target.id == "maxNumber")
		{
			console.log("saving maxNumber");
			oldMaxNumber = intValue;
		}
		else if (e.target.id == "maxDays")
		{
			console.log("saving maxDays");
			oldMaxDays = intValue;
		}
	}
}

function handleClick(cb) {
	console.log("Clicked, new value = " + cb.checked);
}

function content_loaded() {

	console.log("content loaded");

	load_options();

	//add check listener to checkboxes
	var checkBoxes = document.querySelectorAll('.checkBox');

	console.log("There are " + checkBoxes.length + " checkboxes");

	for (var i = 0; i < checkBoxes.length; i++)
	{
		checkBoxes[i].addEventListener('change', checkBoxChangeHandler);
		// if (checkBoxes[i].checked == false)
		// {
		// 	document.getElementById(checkBoxes[i].id + "Input").disabled = true;
		// 	document.getElementById(checkBoxes[i].id + "Input").readOnly = true
		// }
	}

	var numberInputFields = document.querySelectorAll('.numberInput');

	console.log("There are " + numberInputFields.length + " numeric fields");

	for (var i = 0; i < numberInputFields.length; i++)
	{
		numberInputFields[i].addEventListener('focusout', numericInputValidator);
		numberInputFields[i].addEventListener('focusin', oldNumberSaver);
	}
}

//diable numeric input field if checkbox is unchecked
function checkBoxChangeHandler(e)
{
	debugger;
	console.log("entering checkBoxChangeHandler");

	if (e.target.checked)
	{
		console.log(e.target.id + " is checked");
		document.getElementById(e.target.id + "Input").disabled = false;
		document.getElementById(e.target.id + "Input").readOnly = false;
	}
	else
	{
		console.log(e.target.id + " is unchecked");
		document.getElementById(e.target.id + "Input").disabled = true;
		document.getElementById(e.target.id + "Input").readOnly = true;
	}
}

//check numeric input fields for valid input and modify if input is invalid.  This is necessary becasue even though numeric input fields have a min and max user can still input values outside that range.
function numericInputValidator(e)
{
	debugger;
	console.log("numericInputValidator: e.target.value = " + e.target.value);
	console.log("numericInputValidator: e.target.id = " + e.target.id);

	if (e.target.id == "maxNumberInput")
	{
		console.log("numericInputValidator: checking maxNumber");
		if (isNaN(parseInt(e.target.value)))
		{
			if (Number.isInteger(oldMaxNumber))
			{
				e.target.value = oldMaxNumber;
			}
			else
			{
				e.target.value = parseInt(e.target.min);
				oldMaxNumber = parseInt(e.target.min);
			}
		}
		else if (parseInt(e.target.value) < parseInt(e.target.min))
		{
			e.target.value = parseInt(e.target.min);
			oldMaxNumber = parseInt(e.target.min);
		}
		else if (parseInt(e.target.value) > parseInt(e.target.max))
		{
			e.target.value = parseInt(e.target.max);
			oldMaxNumber = parseInt(e.target.max);
		}
		else
		{
			oldMaxNumber = parseInt(e.target.value);
		}
	}
	else if (e.target.id == "maxDaysInput")
	{
		console.log("numericInputValidator: checking maxDays");
		if (isNaN(parseInt(e.target.value)))
		{
			if (Number.isInteger(oldMaxDays))
			{
				e.target.value = oldMaxDays;
			}
			else
			{
				e.target.value = parseInt(e.target.min);
				oldMaxDays = parseInt(e.target.min);
			}
		}
		else if (parseInt(e.target.value) < parseInt(e.target.min))
		{
			e.target.value = parseInt(e.target.min);
			oldMaxDays = parseInt(e.target.min);
		}
		else if (parseInt(e.target.value) > parseInt(e.target.max))
		{
			e.target.value = parseInt(e.target.max);
			oldMaxDays = parseInt(e.target.max);
		}
		else
		{
			oldMaxDays = parseInt(e.target.value);
		}
	}
}


function save_options()  {
	console.log("Save Clicked");
	//var numberBoxChecked = document.getElementById('maxNumber').checked;
	var numberInput = parseInt(document.getElementById('maxNumberInput').value);
	var dateBoxChecked = document.getElementById('maxDays').checked;
	var dateInput = parseInt(document.getElementById('maxDaysInput').value);

	chrome.storage.sync.set({
		//numberBoxChecked: numberBoxChecked,
		numberInput: numberInput,
		dateBoxChecked: dateBoxChecked,
		dateInput: dateInput
	}, function() {
					debugger;
					var error = chrome.runtime.lastError;
					var status = document.getElementById('saveSpan');

					status.textContent = 'Options Saved.';
					setTimeout(function() {
						status.textContent = '';
					}, 750);
		});
}

function load_options() {
	console.log("Loading saved options");
	chrome.storage.sync.get({
		//numberBoxChecked: true,
		numberInput: 10,
		dateBoxChecked: true,
		dateInput: 30
	}, function(items) {
				debugger;
				var error = chrome.runtime.lastError; //todo: remove after testing

				//document.getElementById('maxNumber').checked = items.numberBoxChecked;
				document.getElementById('maxNumberInput').value = items.numberInput;
				document.getElementById('maxDays').checked = items.dateBoxChecked;
				document.getElementById('maxDaysInput').value = items.dateInput;

				//if (items.numberBoxChecked == false)
				//{
				//	document.getElementById('maxNumberInput').disabled = true;
				//	document.getElementById('maxNumberInput').readOnly = true;
				//}
				if (items.dateBoxChecked == false)
				{
					document.getElementById('maxDaysInput').disabled = true;
					document.getElementById('maxDaysInput').readOnly = true;
				}
	});

}

function close_window() {
	window.close();
}

document.addEventListener('DOMContentLoaded', content_loaded);
document.getElementById('save').addEventListener('click', save_options);
