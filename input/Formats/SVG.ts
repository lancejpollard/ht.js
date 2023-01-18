import R3.Geometry;
import System.Collections.Generic;
import System.Linq;
import System.Xml.Linq;

module R3.Core {
    
    export class SVG {
        
        public static WritePolygons(file: string, polygons: List<Polygon>) {
            //  Getting units right was troublesome.
            //  See http://stackoverflow.com/questions/1346922/svg-and-dpi-absolute-units-and-user-units-inkscape-vs-firefox-vs-imagemagick/2306752#2306752
            let xDocument: XDocument = new XDocument(new XElement("svg", new XAttribute("width", "5in"), new XAttribute("height", "5in"), new XAttribute("viewBox", "0 0 5 5"), new XElement("g", new XAttribute("style", "fill:none;stroke:#0000FF;stroke-width:0.00005in"), new XElement("circle", new XAttribute("cx", "0"), new XAttribute("cy", "0"), new XAttribute("r", "1")), polygons.Select(() => {  }, SVG.XPolygon(poly)))));
            xDocument.Save(file);
        }
        
        public static WriteSegments(file: string, segs: List<Segment>) {
            let xDocument: XDocument = new XDocument(new XElement("svg", new XAttribute("width", "5in"), new XAttribute("height", "5in"), new XAttribute("viewBox", "0 0 5 5"), new XElement("g", new XAttribute("style", "fill:none;stroke:#0000FF;stroke-width:0.00005in"), new XElement("circle", new XAttribute("cx", "0"), new XAttribute("cy", "0"), new XAttribute("r", "1")), segs.Select(() => {  }, SVG.XSegment(s)))));
            xDocument.Save(file);
        }
        
        private static XPolygon(poly: Polygon): XElement {
            //  This makes the unit disk have a 1 inch radius.
            //  The 72 / 25.4 is because Inkscape templates use pt for their main SVG units.
            const let scale: number = 1;
            // ( 254 / 2 ) * ( 72 / 25.4 );
            let coords: string = "";
            for (let i: number = 0; (i < poly.Segments.Count); i++) {
                let seg: Segment = poly.Segments[i];
                if ((0 == i)) {
                    coords = (coords + ("M " + SVG.FormatPoint(seg.P1, scale)));
                }
                
                if ((seg.Type == SegmentType.Arc)) {
                    let largeArc: boolean = (seg.Angle > System.Math.PI);
                    let sweepDirection: boolean = !seg.Clockwise;
                    coords = (coords + ("A " 
                                + (SVG.FormatDouble(seg.Radius, scale) + ("," 
                                + (SVG.FormatDouble(seg.Radius, scale) + (" 0 " 
                                + (SVG.FormatBool(largeArc) 
                                + (SVG.FormatBool(sweepDirection) + SVG.FormatPoint(seg.P2, scale)))))))));
                }
                else {
                    coords = (coords + ("L " + SVG.FormatPoint(seg.P2, scale)));
                }
                
            }
            
            return new XElement("path", new XAttribute("d", coords));
        }
        
        private static XSegment(seg: Segment): XElement {
            let poly: Polygon = new Polygon();
            poly.Segments.Add(seg);
            return SVG.XPolygon(poly);
        }
        
        private static FormatBool(value: boolean): string {
            return "1 ";
            // TODO: Warning!!!, inline IF is not supported ?
            value;
            "0 ";
        }
        
        private static FormatPoint(p: Vector3D, scale: number): string {
            return (SVG.FormatDouble(p.X, scale) + ("," 
                        + (SVG.FormatDouble(p.Y, scale) + " ")));
        }
        
        private static FormatDouble(d: number, scale: number): string {
            return string.Format("{0:F6}", (d * scale));
        }
    }
}