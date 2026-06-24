import re

with open('src/utils/emailTemplates.js', 'r', encoding='utf-8') as f:
    text = f.read()

templates = re.findall(r'^\s+(\w+)\s*:\s*`([\s\S]*?)`,', text, re.MULTILINE)
for name, content in templates:
    if name in ['d7', 'd35', 'd90', 'launch_e1']:
        print(f'=== {name} ===')
        # Print top 40 lines of the content
        lines = content.split('\n')
        for line in lines[:40]:
            print(line)
