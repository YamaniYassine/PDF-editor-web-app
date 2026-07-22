export interface TextItem {
    text: string;
    original_text: string;
    x: number;
    y: number;
    font_size: number;
    width: number;
    height: number;
    baseline: number;
    font_name: string;
    is_bold: boolean;
    is_italic: boolean;
    color: [number, number, number];
    page_number: number;
}
