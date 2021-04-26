import { LitElement, html } from 'lit-element';
import { CodeMirrorStyles, CodeMirrorLintStyles, CodeMirrorHintStyles, XTextAnnotationsStyles, AutocompleteWidgetStyle } from './shared-styles.js';

class SAPLEditor extends LitElement {

  constructor() {
    super();
    this.document = "";
    this.xtextLang = "sapl";
  }

  static get properties() {
    return {
      document: { type: String },
      isReadOnly: { type: Boolean },
      hasLineNumbers: { type: Boolean },
      autoCloseBrackets: { type: Boolean },
      matchBrackets: { type: Boolean },
      textUpdateDelay: { type: Number },
      editor: { type: Object },
      xtextLang: { type: String },
    }
  }

  static get styles() {
    return [
      CodeMirrorStyles,
      CodeMirrorLintStyles,
      CodeMirrorHintStyles,
      XTextAnnotationsStyles,
      AutocompleteWidgetStyle,
    ]
  }

  set isReadOnly(value) {
    let oldVal = this._isReadOnly;
    this._isReadOnly = value;
    console.debug('set - property change: ', 'isReadOnly', oldVal, value);
    this.requestUpdate('isReadOnly', oldVal);
    this.setEditorOption('readOnly', value);
  }

  connectedCallback() {
    super.connectedCallback();

    var self = this;
    var shadowRoot = self.shadowRoot;

    var widget_container = document.createElement("div");
    widget_container.id = "widgetContainer";

    require(["./xtext-codemirror.min",
      "./sapl-mode"], function (xtext, mode) {
        self.editor = xtext.createEditor({
          document: shadowRoot,
          xtextLang: self.xtextLang,
          sendFullText: true,
          syntaxDefinition: mode,
          readOnly: self.isReadOnly,
          lineNumbers: self.hasLineNumbers,
          showCursorWhenSelecting: true,
          enableValidationService: true,
          textUpdateDelay: self.textUpdateDelay,
          gutters: ["CodeMirror-lint-markers"],
          extraKeys: {"Ctrl-Space": "autocomplete"},
          hintOptions: { 
            container: widget_container
          }
        });

        self.editor.doc.setValue(self.document);
        self.editor.doc.on("change", function (doc, changeObj) {
          var value = doc.getValue();
          self.onDocumentChanged(value);
        });

        self.registerValidationCallback(self.editor);

        shadowRoot.appendChild(widget_container);
      });
  }

  registerValidationCallback(editor) {
    var self = this;

    var xTextServices = editor.xtextServices;
    xTextServices.originalValidate = xTextServices.validate;
    xTextServices.validate = function (addParam) {
      var services = this;
      return services.originalValidate(addParam).done(function (result) {
        if(self.$server !== undefined) {
          var issues = result.issues;
          self.$server.onValidation(issues);
        }
        else {
          throw "Connection between editor and server could not be established. (onValidation)";
        }
      });
    }
  }

  onDocumentChanged(value) {
    this.document = value;
    if(this.$server !== undefined) {
      this.$server.onDocumentChanged(value);
    }
    else {
      throw "Connection between editor and server could not be established. (onDocumentChanged)";
    }
  }

  setEditorDocument(element, document) {
    this.document = document;
    if(element.editor !== undefined) {
      element.editor.doc.setValue(document);
    }
  }

  setEditorOption(option, value) {
    console.debug('setEditorOption', option, value);
    if(this.editor !== undefined) {
      this.editor.setOption(option, value);  
    }
  }

  render() {
    return html`
<div id="xtext-editor" data-editor-xtext-lang="${this.xtextLang}"/>
		      `;
  }
}

customElements.define('sapl-editor', SAPLEditor);