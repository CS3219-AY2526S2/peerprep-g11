import { NextRequest, NextResponse } from 'next/server';

const QUESTION_SERVICE_URL = process.env.QUESTION_SERVICE_URL ?? 'http://localhost:8000';

export async function GET(request: NextRequest) {
    try {
        console.log("Here")
        const body = await request.body
        const response = await fetch(`${QUESTION_SERVICE_URL}/questions/retrieve`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        })

        const data = await response.json()
        return NextResponse.json(data, {status: response.status})
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error"}, {status: 500})
    }
}