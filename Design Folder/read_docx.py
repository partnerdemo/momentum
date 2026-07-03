import zipfile
import xml.etree.ElementTree as ET
import sys
import os
import glob

def read_docx(file_path):
    try:
        # Handle wildcard if passed
        if '*' in file_path:
            files = glob.glob(file_path)
            if not files:
                return "Error: No file found matching pattern"
            file_path = files[0]
            print(f"Reading file: {file_path}")

        with zipfile.ZipFile(file_path) as docx:
            xml_content = docx.read('word/document.xml')
            tree = ET.fromstring(xml_content)
            
            ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            text = []
            for p in tree.findall('.//w:p', ns):
                p_text = []
                for r in p.findall('.//w:r', ns):
                    for t in r.findall('.//w:t', ns):
                        if t.text:
                            p_text.append(t.text)
                if p_text:
                    text.append(''.join(p_text))
            return '\n'.join(text)
    except Exception as e:
        return f"Error reading {file_path}: {str(e)}"

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python read_docx.py <file_path>")
        sys.exit(1)
    
    # Handle potential encoding issues in console output
    sys.stdout.reconfigure(encoding='utf-8')
    print(read_docx(sys.argv[1]))
