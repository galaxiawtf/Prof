
const DB_KEY = 'student_db_v8';

const defaultCourseList = [
    { code: 'SA 101', name: 'System Administration And Maintenance', units: 3, grade: 0 },
    { code: 'ITSP2B', name: 'Network Implementation And Support II', units: 3, grade: 0 },
    { code: 'BPM101', name: 'Business Process Management In IT', units: 3, grade: 0 },
    { code: 'TEC101', name: 'Technopreneurship', units: 3, grade: 0 },
    { code: 'IAS102', name: 'Information Assurance And Security 2', units: 3, grade: 0 },
    { code: 'SP101', name: 'Social and Professional Issues', units: 3, grade: 0 }
];

const ACADEMIC_YEARS = ['2026-2025', '2025-2024', '2024-2023'];
const SEMESTERS = ['1st Semester', '2nd Semester'];

function buildDefaultAcademicRecords() {
    const records = {};
    ACADEMIC_YEARS.forEach(year => {
        records[year] = {
            '1st Semester': JSON.parse(JSON.stringify(defaultCourseList)),
            '2nd Semester': JSON.parse(JSON.stringify(defaultCourseList))
        };
    });
    return records;
}

const defaultAcademicRecords = buildDefaultAcademicRecords();

const DB = {
    init() {
        if (!localStorage.getItem(DB_KEY)) {
            const initialData = []; // Start with empty array instead of default student
            localStorage.setItem(DB_KEY, JSON.stringify(initialData));
            console.log('Database initialized as empty.');
        }
    },

    isEmpty() {
        const students = this.getAll();
        return students.length === 0;
    },

    requiresRegistration() {
        return this.isEmpty();
    },

    getAll() {
        this.init();
        return JSON.parse(localStorage.getItem(DB_KEY));
    },

    getById(id) {
        const students = this.getAll();
        const student = students.find(s => String(s.id) === String(id));
        if (!student) return null;
        const fullRecords = buildDefaultAcademicRecords();
        const existing = student.academicRecords && typeof student.academicRecords === 'object' ? student.academicRecords : {};
        ACADEMIC_YEARS.forEach(year => {
            if (!fullRecords[year]) fullRecords[year] = {};
            SEMESTERS.forEach(sem => {
                const existingEntries = existing[year] && existing[year][sem];
                if (Array.isArray(existingEntries) && existingEntries.length > 0) {
                    fullRecords[year][sem] = existingEntries.map(entry => ({
                        code: entry.code,
                        name: entry.name || '',
                        units: parseInt(entry.units, 10) || 0,
                        grade: entry.grade != null && entry.grade !== '' ? parseFloat(entry.grade) : 0
                    }));
                }
            });
        });
        student.academicRecords = fullRecords;
        const hadPartialRecords = !existing || !ACADEMIC_YEARS.every(y => existing[y] && SEMESTERS.every(s => Array.isArray(existing[y] && existing[y][s])));
        if (hadPartialRecords) {
            this.update(id, { academicRecords: fullRecords });
        }
        return JSON.parse(JSON.stringify(student));
    },

    save(student) {
        const students = this.getAll();
        if (!student.id) {
            const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const randomPart = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            student.id = `${datePart}${randomPart}`;
        }

        // Apply default records to new students
        if (!student.academicRecords) {
            student.academicRecords = JSON.parse(JSON.stringify(defaultAcademicRecords));
        }

        students.push(student);
        localStorage.setItem(DB_KEY, JSON.stringify(students));
        return student;
    },

    update(id, updatedFields) {
        const students = this.getAll();
        const index = students.findIndex(s => String(s.id) === String(id));
        if (index !== -1) {
            students[index] = { ...students[index], ...updatedFields };
            localStorage.setItem(DB_KEY, JSON.stringify(students));
            return students[index];
        }
        return null;
    },

    add(student) {
        const saved = this.save(student);
        this.setActive(saved.id);
        return saved;
    },

    setActive(id) {
        localStorage.setItem('active_student_id', id);
    },

    getActive() {
        const id = localStorage.getItem('active_student_id');
        if (id) {
            const student = this.getById(id);
            if (student) return student;
            localStorage.removeItem('active_student_id');
        }

        const students = this.getAll();
        if (students.length > 0) {
            const latest = students[students.length - 1];
            this.setActive(latest.id);
            return this.getById(latest.id);
        }
        return null; // Return null when no students exist
    }
};

window.StudentDB = DB;
