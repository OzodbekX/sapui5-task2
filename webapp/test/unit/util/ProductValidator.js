/*global QUnit*/

sap.ui.define(
  ["project1/util/ProductValidator", "sap/ui/core/library"],
  function (ProductValidator, coreLibrary) {
    "use strict";

    var ValueState = coreLibrary.ValueState;
    var TEXTS = {
      required: "required",
      invalidNumber: "invalidNumber",
      invalidInteger: "invalidInteger",
      invalidDate: "invalidDate",
      discontinuedBeforeRelease: "discontinuedBeforeRelease",
    };

    function createInput(sValue) {
      return {
        state: ValueState.None,
        stateText: "",
        getValue: () => sValue,
        setValueState(s) { this.state = s; },
        setValueStateText(s) { this.stateText = s; },
      };
    }

    function createPicker(oDate, bRequired) {
      var oPicker = createInput(oDate ? "some date" : "");
      oPicker.getDateValue = () => oDate;
      oPicker.isValidValue = () => true;
      oPicker.getRequired = () => bRequired;
      return oPicker;
    }

    function validate(oOverrides) {
      var oArgs = Object.assign(
        {
          textInputs: [createInput("Bread")],
          numberInputs: [],
          integerInputs: [],
          releasePicker: createPicker(new Date(2020, 0, 1), true),
          discontinuedPicker: createPicker(null, false),
          texts: TEXTS,
        },
        oOverrides,
      );
      return ProductValidator.validateProductDialog(oArgs);
    }

    QUnit.module("ProductValidator");

    QUnit.test("valid form passes, empty optional date is allowed", function (assert) {
      assert.strictEqual(validate({}), true);
    });

    QUnit.test("decimal value in an integer field is rejected", function (assert) {
      var oId = createInput("1.7");
      assert.strictEqual(validate({ numberInputs: [oId], integerInputs: [oId] }), false);
      assert.strictEqual(oId.stateText, "invalidInteger");
    });

    QUnit.test("decimal value in a non-integer field is accepted", function (assert) {
      assert.strictEqual(validate({ numberInputs: [createInput("12.5")] }), true);
    });

    QUnit.test("negative number is rejected", function (assert) {
      var oPrice = createInput("-1");
      assert.strictEqual(validate({ numberInputs: [oPrice] }), false);
      assert.strictEqual(oPrice.stateText, "invalidNumber");
    });

    QUnit.test("discontinued before release is rejected", function (assert) {
      var oDisc = createPicker(new Date(2019, 0, 1), false);
      assert.strictEqual(validate({ discontinuedPicker: oDisc }), false);
      assert.strictEqual(oDisc.stateText, "discontinuedBeforeRelease");
    });

    QUnit.test("all invalid fields get an error state, not just the first", function (assert) {
      var oName = createInput("");
      var oPrice = createInput("");
      validate({ textInputs: [oName], numberInputs: [oPrice] });
      assert.strictEqual(oName.state, ValueState.Error);
      assert.strictEqual(oPrice.state, ValueState.Error);
    });
  },
);
