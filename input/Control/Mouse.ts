import System;
import System.Collections.Generic;
import System.Diagnostics;
import System.Linq;
import System.Windows.Forms;

module R3.Control {

    ///  <summary>
    ///  Data passed along with a click.
    ///  </summary>
    export class ClickData {

        public constructor (x: number, y: number) {
            X = x;
            Y = y;
        }

        public get X(): number {
        }
        public set X(value: number)  {
        }

        public get Y(): number {
        }
        public set Y(value: number)  {
        }

        public get Button(): MouseButtons {
        }
        public set Button(value: MouseButtons)  {
        }
    }

    ///  <summary>
    ///  Data passed along with a drag.
    ///  </summary>
    export class DragData {

        ///  <summary>
        ///  The actual drag location.
        ///  </summary>
        public get X(): number {
        }
        public set X(value: number)  {
        }

        public get Y(): number {
        }
        public set Y(value: number)  {
        }

        ///  <summary>
        ///  The drag amount, in rectangular coords.
        ///  </summary>
        public get XDiff(): number {
        }
        public set XDiff(value: number)  {
        }

        public get YDiff(): number {
        }
        public set YDiff(value: number)  {
        }

        public get XPercent(): number {
        }
        public set XPercent(value: number)  {
        }

        public get YPercent(): number {
        }
        public set YPercent(value: number)  {
        }

        ///  <summary>
        ///  The drag amount, in polar coords
        ///  Rotation is in radians.
        ///  </summary>
        public get Rotation(): number {
        }
        public set Rotation(value: number)  {
        }

        public get Radial(): number {
        }
        public set Radial(value: number)  {
        }

        public get RadialPercent(): number {
        }
        public set RadialPercent(value: number)  {
        }

        public get Button(): MouseButtons {
        }
        public set Button(value: MouseButtons)  {
        }

        public ShiftDown: boolean;

        public CtrlDown: boolean;
    }

    ///  <summary>
    ///  Class for doing drag/click logic.
    ///  It handles some of the nuances of puzzle based inputs.
    ///  For example, we can't simply handle the Click event on an a draw control,
    ///  because if you drag, that still fires when lifting the mouse button.
    ///  </summary>
    export class MouseHandler {

        public constructor () {
            m_skipClick = false;
            m_spinning = false;
            m_dragging = false;
            m_downY = -1;
            m_downX = -1;
            m_lastY = 0;
            m_lastX = 0;
        }

        public get LastX(): number {
            return m_lastX;
        }

        public get LastY(): number {
            return m_lastY;
        }

        public Setup(drawSurface: Control) {
            m_drawSurface = drawSurface;
            m_drawSurface.MouseDown.addEventListener(new MouseEventHandler(this.MouseDown));
            m_drawSurface.MouseMove.addEventListener(new MouseEventHandler(this.MouseMove));
            m_drawSurface.MouseUp.addEventListener(new MouseEventHandler(this.MouseUp));
        }

        public SetClickHandler(clickHandler: Action<ClickData>) {
            m_clickHandler = clickHandler;
        }

        public SetDragHandler(dragHandler: Action<DragData>) {
            m_dragHandler = dragHandler;
        }

        public SetSpinHandler(spinHandler: Action) {
            m_spinHandler = spinHandler;
        }

        //
        //  Event handlers.
        //
        private MouseDown(sender: Object, e: MouseEventArgs) {
            m_downX = e.X;
            m_downY = e.Y;
            //  If we are spinning, don't let this turn into a click.
            if (m_spinning) {
                m_skipClick = true;
            }

            m_spinning = false;
            m_dragging = false;
        }

        private MouseMove(sender: Object, e: MouseEventArgs) {
            //  Make sure we have the focus.
            m_drawSurface.Select();
            //  Are we starting a drag?
            //  NOTE: The mousedown checks make sure we had a mouse down call and fixes a problem I was seeing
            //          where the view would reset when you loaded in a log file.
            if ((!m_dragging
                        && ((e.Button != MouseButtons.None)
                        && ((-1 != m_downX)
                        && ((-1 != m_downY)
                        && ((Math.abs((e.X - m_downX))
                        > (SystemInformation.DragSize.Width / 2))
                        || (Math.abs((e.Y - m_downY))
                        > (SystemInformation.DragSize.Height / 2)))))))) {
                this.StartDrag();
                //  Fake the original mouse position so we will get some drag motion immediately.
                m_lastX = m_downX;
                m_lastY = m_downY;
            }

            //  Are we dragging?
            if (m_dragging) {
                this.PerformDrag(e.X, e.Y, e.Button);
                //  This is so we can check if we want to start spinning.
                m_stopWatch.Restart();
            }

            m_lastX = e.X;
            m_lastY = e.Y;
        }

        private m_stopWatch: Stopwatch = new Stopwatch();

        private MouseUp(sender: Object, e: MouseEventArgs) {
            //  NOTE: The mousedown checks make sure we had a mouse down call and fixes a problem I was seeing
            //          where where unintended sticker clicks could happen when loading a log file.
            if (((-1 == m_downX) || (-1 == m_downY))) {
                return;
            }

            m_downY = -1;
            m_downX = -1;
            //  Figure out if we were dragging, and if the drag is done.
            if (m_dragging) {
                if ((Form.MouseButtons == MouseButtons.None)) {
                    this.FinishDrag();
                    //  Using elapsed time works much better than checking how many pixels moved (as MC4D does).
                    m_spinning = (this.m_stopWatch.ElapsedMilliseconds < 50);
                    this.m_stopWatch.Stop();
                    System.Diagnostics.Trace.WriteLine(string.Format("Spinning = {0}, Elapsed = {1}", m_spinning, this.m_stopWatch.ElapsedMilliseconds));
                    if ((m_spinning
                                && (m_spinHandler != null))) {
                        m_spinHandler();
                    }

                }

                m_skipClick = false;
                return;
            }

            //  Past here, the mouse-up represents a click.
            if (((e.Button == MouseButtons.Left)
                        || (e.Button == MouseButtons.Right))) {
                if ((!m_skipClick
                            && (m_clickHandler != null))) {
                    let clickData: ClickData = new ClickData(e.X, e.Y);
                    clickData.Button = e.Button;
                    m_clickHandler(clickData);
                }

                m_skipClick = false;
            }

        }

        //
        //  Drag helpers
        //
        StartDrag() {
            m_dragging = true;
            m_drawSurface.Capture = true;
        }

        PerformDrag(x: number, y: number, btn: MouseButtons) {
            if ((m_dragHandler == null)) {
                return;
            }

            let dragData: DragData = new DragData();
            dragData.X = x;
            dragData.Y = y;
            dragData.XDiff = (x - m_lastX);
            dragData.YDiff = (y - m_lastY);
            //  This is the increment we moved, scaled to the window size.
            dragData.XPercent = ((<number>(dragData.XDiff)) / (<number>(m_drawSurface.Width)));
            dragData.YPercent = ((<number>(dragData.YDiff)) / (<number>(m_drawSurface.Height)));
            //  How much we rotated relative to center.
            let y1: number = ((m_drawSurface.Height / 2)
                        - m_lastY);
            let x1: number = (m_lastX
                        - (m_drawSurface.Width / 2));
            let y2: number = ((m_drawSurface.Height / 2)
                        - y);
            let x2: number = (x
                        - (m_drawSurface.Width / 2));
            let angle1: number = Math.atan2(y1, x1);
            let angle2: number = Math.atan2(y2, x2);
            dragData.Rotation = (((angle2)) - ((angle1)));
            //  Our radial change.
            let r1: number = Math.sqrt(((x1 * x1)
                            + (y1 * y1)));
            let r2: number = Math.sqrt(((x2 * x2)
                            + (y2 * y2)));
            dragData.Radial = (((r2)) - ((r1)));
            dragData.RadialPercent = (((r2)) / ((r1)));
            dragData.Button = btn;
            dragData.ShiftDown = this.ShiftDown;
            dragData.CtrlDown = this.CtrlDown;
            m_dragHandler(dragData);
        }

        FinishDrag() {
            m_drawSurface.Capture = false;
            m_dragging = false;
        }

        public get IsSpinning(): boolean {
            return m_spinning;
        }
        public set IsSpinning(value: boolean)  {
            m_spinning = value;
        }

        ///  <summary>
        ///  The control we'll be handling mouse input for.
        ///  </summary>
        private get m_drawSurface(): Control {
        }
        private set m_drawSurface(value: Control)  {
        }

        ///  <summary>
        ///  Tracking variables
        ///  </summary>
        private m_downX: number;

        private m_downY: number;

        private m_dragging: boolean;

        private m_spinning: boolean;

        private m_skipClick: boolean;

        private m_lastX: number;

        private m_lastY: number;

        m_clickHandler: Action<ClickData>;

        m_dragHandler: Action<DragData>;

        m_spinHandler: Action;

        private get CtrlDown(): boolean {
            return ((Form.ModifierKeys & Keys.Control)
                        == Keys.Control);
        }

        private get ShiftDown(): boolean {
            return ((Form.ModifierKeys & Keys.Shift)
                        == Keys.Shift);
        }
    }
}
