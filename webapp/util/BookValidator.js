sap.ui.define(["sap/ui/core/library"], (coreLibrary) => {
  "use strict";

  const { ValueState } = coreLibrary;

  const validateBookDialog = ({
    textInputs,
    datePicker,
    quantityInput,
    requiredText,
    invalidQuantityText,
  }) => {
    let isValid = true;

    textInputs.forEach((input) => {
      if (!input.getValue().trim()) {
        input.setValueState(ValueState.Error);
        input.setValueStateText(requiredText);
        isValid = false;
      } else {
        input.setValueState(ValueState.None);
      }
    });

    if (!datePicker.getDateValue() || !datePicker.isValidValue()) {
      datePicker.setValueState(ValueState.Error);
      datePicker.setValueStateText(requiredText);
      isValid = false;
    } else {
      datePicker.setValueState(ValueState.None);
    }

    const quantityText = quantityInput.getValue().trim();
    const quantity = Number(quantityText);

    if (quantityText === "" || !Number.isFinite(quantity) || quantity < 0) {
      quantityInput.setValueState(ValueState.Error);
      quantityInput.setValueStateText(invalidQuantityText);
      isValid = false;
    } else {
      quantityInput.setValueState(ValueState.None);
    }

    return isValid;
  };

  return {
    validateBookDialog,
  };
});
