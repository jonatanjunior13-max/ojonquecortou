const fs = require('fs');

// Fix Services.jsx
let servicesContent = fs.readFileSync('src/components/Services.jsx', 'utf-8');
servicesContent = servicesContent.replace('const [categories, setCategories] = useState([]);\n  const [loading, setLoading] = useState(true);', 'const [, setCategories] = useState([]);\n  const [, setLoading] = useState(true);');
fs.writeFileSync('src/components/Services.jsx', servicesContent);

// Fix Services.test.jsx
let testContent = fs.readFileSync('src/components/Services.test.jsx', 'utf-8');
testContent = "import { describe, it, expect, beforeEach } from 'vitest';\n" + testContent;
fs.writeFileSync('src/components/Services.test.jsx', testContent);
