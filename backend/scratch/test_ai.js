import axios from 'axios';

const testAI = async () => {
    try {
        const res = await axios.post('http://localhost:3000/api/v1/ai/chat', {
            message: "Hello"
        });
        console.log("Response:", res.data);
    } catch (err) {
        console.error("Error:", err.response ? err.response.data : err.message);
    }
}

testAI();
