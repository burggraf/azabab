export type Question = {
    [key: string]: any;
    id: string;
    category: string;
    subcategory: string;
    question: string;
    a: string;
    b: string;
    c: string;
    d: string;
    difficulty: string;
    updated: string;
    created: string;
    collectionId: string;
    collectionName: string;
    correctAnswer: string;
    correctLetter: string;
    answerMap: any; //string[];
}
export const initQuestion = () => {
    return {
        id: '',
        category: '',
        subcategory: '',
        question: '',
        a: '',
        b: '',
        c: '',
        d: '',
        difficulty: '',
        updated: '',
        created: '',
        collectionId: '',
        collectionName: '',
        correctAnswer: '',
        correctLetter: '',
        answerMap: []
    };
};