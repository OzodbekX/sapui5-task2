sap.ui.define(["sap/ui/core/library"], (coreLibrary) => {
  "use strict";

  const { ValueState } = coreLibrary;

  const setError = (control, text) => {
    control.setValueState(ValueState.Error);
    control.setValueStateText(text);
  };

  const clearError = (control) => {
    control.setValueState(ValueState.None);
    control.setValueStateText("");
  };

  const validateText = (input, texts) => {
    if (!input.getValue().trim()) {
      setError(input, texts.required);
      return false;
    }
    clearError(input);
    return true;
  };

  const validateNumber = (input, texts, mustBeInteger) => {
    const raw = input.getValue().trim();
    const num = Number(raw);
    if (raw === "") {
      setError(input, texts.required);
      return false;
    }
    if (!Number.isFinite(num) || num < 0) {
      setError(input, texts.invalidNumber);
      return false;
    }
    if (mustBeInteger && !Number.isInteger(num)) {
      setError(input, texts.invalidInteger);
      return false;
    }
    clearError(input);
    return true;
  };

  const validateDate = (picker, texts) => {
    const isEmpty = !picker.getValue().trim();
    if (isEmpty && !picker.getRequired()) {
      clearError(picker);
      return true;
    }
    if (!picker.getDateValue() || !picker.isValidValue()) {
      setError(picker, isEmpty ? texts.required : texts.invalidDate);
      return false;
    }
    clearError(picker);
    return true;
  };

  const validateDateOrder = (releasePicker, discontinuedPicker, texts) => {
    const releaseDate = releasePicker.getDateValue();
    const discontinuedDate = discontinuedPicker.getDateValue();
    if (releaseDate && discontinuedDate && discontinuedDate < releaseDate) {
      setError(discontinuedPicker, texts.discontinuedBeforeRelease);
      return false;
    }
    return true;
  };

  const validateProductDialog = ({
    textInputs,
    numberInputs,
    integerInputs,
    releasePicker,
    discontinuedPicker,
    texts,
  }) => {
    const textResults = textInputs.map((input) => validateText(input, texts));
    const numberResults = numberInputs.map((input) =>
      validateNumber(input, texts, integerInputs.includes(input)),
    );
    const datesValid = [releasePicker, discontinuedPicker]
      .map((picker) => validateDate(picker, texts))
      .every(Boolean);

    const orderValid =
      datesValid && validateDateOrder(releasePicker, discontinuedPicker, texts);

    return [...textResults, ...numberResults].every(Boolean) && orderValid;
  };

  return {
    validateText,
    validateNumber,
    validateDate,
    validateProductDialog,
  };
});
