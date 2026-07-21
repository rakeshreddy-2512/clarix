import * as cheerio from "cheerio";

export interface Student {
    name: string;
    regNo: string;
    program: string;
    department: string;
    semester: string;
    batch: string;
    section: string;
    email: string;
}

function extractContent(html: string): string {
    // Pattern 1: pageSanitizer.sanitize('...')
    if (html.includes("sanitize('")) {
        try {
            let a = html.split("sanitize('")[1].split("');function doa")[0];
            a = a.replaceAll("\\x", "%");
            a = unescape(a);
            if (a.length > 100) return a;
        } catch { }
    }

    // Pattern 2: innerHTML = pageSanitizer.sanitize('...')
    const innerMatch = html.match(/\.innerHTML\s*=\s*pageSanitizer\.sanitize\('([\s\S]+?)'\)/);
    if (innerMatch) {
        try {
            let a = innerMatch[1];
            a = a.replaceAll("\\x", "%");
            a = unescape(a);
            return a;
        } catch { }
    }

    // Pattern 3: zmlvalue attribute
    if (html.includes('zmlvalue="')) {
        try {
            let a = html.split('zmlvalue="')[1].split('"></div>')[0];
            a = a.replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
                .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
                .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&apos;/g, "'");
            return a;
        } catch { }
    }

    return html;
}

function decodeContent(html: string): string {
    return html
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t")
        .replace(/\\-/g, "-")
        .replace(/\\"/g, '"')
        .replace(/\\\//g, "/");
}

export function parseProfile(html: string): Student {
    const student: Student = {
        name: "", regNo: "", program: "", department: "",
        semester: "", batch: "", section: "", email: ""
    };

    const extracted = extractContent(html);
    const decoded = decodeContent(extracted);
    const $ = cheerio.load(`<body>${decoded}</body>`);

    // Method 1: table row key-value pairs
    $("table tr").each((_, row) => {
        const cells = $(row).find("td");
        if (cells.length >= 2) {
            const key = $(cells[0]).text().trim().toLowerCase();
            const value = $(cells[1]).find("strong").text().trim() || $(cells[1]).text().trim();

            if (key.includes("name") && !key.includes("faculty") && !key.includes("course")) {
                if (!student.name) student.name = value;
            } else if (key.includes("registration") || key.includes("reg no") || key.includes("roll")) {
                if (!student.regNo) student.regNo = value;
            } else if (key.includes("program")) {
                student.program = value;
            } else if (key.includes("department")) {
                student.department = value;
            } else if (key.includes("specializ") || key.includes("section")) {
                student.section = value;
            } else if (key.includes("semester")) {
                student.semester = $(cells[1]).find("strong").first().text().trim() || value;
            } else if (key.includes("batch")) {
                student.batch = value;
            } else if (key.includes("email")) {
                student.email = value;
            }
        }
    });

    // Method 2: cntdDiv table structure (acadia.works style)
    if (!student.name || !student.regNo) {
        const cntdTable = $(".cntdDiv table").eq(0);
        if (cntdTable.length) {
            const trs = $("tr", cntdTable);
            const roll = $($(trs[0]).find("td")[1]).text().trim();
            const name = $($(trs[1]).find("td")[1]).text().trim();
            const program = $($(trs[2]).find("td")[1]).text().trim();
            const department = $($(trs[3]).find("td")[1]).text().trim();
            const specialisation = $($(trs[4]).find("td")[1]).text().trim();
            const semester = $($(trs[5]).find("td")[1]).text().trim();
            const batch = $($(trs[5]).find("td")[4]).text().trim();

            if (roll && !student.regNo) student.regNo = roll;
            if (name && !student.name) student.name = name;
            if (program && !student.program) student.program = program;
            if (department && !student.department) student.department = department;
            if (specialisation && !student.section) student.section = specialisation;
            if (semester && !student.semester) student.semester = semester;
            if (batch && !student.batch) student.batch = batch;
        }
    }

    // Method 3: regex fallbacks
    if (!student.regNo) {
        const regMatch = decoded.match(/RA\d{13}/);
        if (regMatch) student.regNo = regMatch[0];
    }

    if (!student.name) {
        const nameMatch = decoded.match(/Name[:\s]*<\/td>\s*<td[^>]*>\s*<strong>([^<]+)<\/strong>/i);
        if (nameMatch) student.name = nameMatch[1].trim();
    }

    // Method 4: Registration Number text pattern
    if (!student.regNo) {
        const regMatch2 = decoded.match(/Registration\s+Number[:\s]*([A-Z]{2}\d{13})/i);
        if (regMatch2) student.regNo = regMatch2[1];
    }

    console.log(`✅ Profile parsed: ${student.name} — ${student.regNo}`);
    return student;
}