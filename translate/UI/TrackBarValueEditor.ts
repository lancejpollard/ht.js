
    export class TrackBarValueEditor extends UITypeEditor {
        
        #editorService: IWindowsFormsEditorService = null;
        
        valueLow: number;
        
        valueHigh: number;
        
        /* override */ EditValue(context: ITypeDescriptorContext, provider: IServiceProvider, value: Object): Object {
            if (((context != null) 
                        && (provider != null))) {
                this.editorService = (<IWindowsFormsEditorService>(provider.GetService(typeof(IWindowsFormsEditorService))));
                if ((this.editorService != null)) {
                    //  Create a new trackbar and set it up.
                    let trackBar: TrackBar = new TrackBar();
                    trackBar.ValueChanged.addEventListener(new EventHandler(this.ValueChanged));
                    trackBar.MouseLeave.addEventListener(new EventHandler(this.MouseLeave));
                    trackBar.Minimum = 0;
                    trackBar.Maximum = 100;
                    trackBar.TickStyle = TickStyle.None;
                    //  Get the low/high values.
                    let prop: PropertyDescriptor = context.PropertyDescriptor;
                    let ra: RangeAttribute = (<RangeAttribute>(prop.Attributes[typeof(RangeAttribute)]));
                    this.valueLow = ra.Low;
                    this.valueHigh = ra.High;
                    //  Set the corresponding trackbar value.
                    let percent: number = ((System.Convert.ToDouble(value) - this.valueLow) 
                                / (this.valueHigh - this.valueLow));
                    trackBar.Value = (<number>((100 * percent)));
                    //  Show the control.
                    this.editorService.DropDownControl(trackBar);
                    //  Here is the output value.
                    value = (this.valueLow 
                                + (((<number>(trackBar.Value)) / 100) 
                                * (this.valueHigh - this.valueLow)));
                }
                
            }
            
            return value;
        }
        
        /* override */ GetEditStyle(context: ITypeDescriptorContext): UITypeEditorEditStyle {
            if (((context != null) 
                        && (context.Instance != null))) {
                return UITypeEditorEditStyle.DropDown;
            }
            
            return super.GetEditStyle(context);
        }
        
        #ValueChanged(sender: Object, e: EventArgs) {
            //  I couldn't figure out how to update the text here, but that would be nice.
        }
        
        #MouseLeave(sender: Object, e: System.EventArgs) {
            if ((this.editorService != null)) {
                this.editorService.CloseDropDown();
            }
            
        }
    }
