import { NextResponse } from 'next/server';

const PODCAST_API_URL = process.env.PODCAST_API_URL;

export async function GET(
    request: Request,
    { params }: { params: Promise<{ jobId: string }> }
) {
    try {
        const { jobId } = await params;

        // Check job status from microservice
        const response = await fetch(`${PODCAST_API_URL}/jobs/${jobId}`);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to get job status');
        }

        const data = await response.json();

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Job status error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get job status' },
            { status: 500 }
        );
    }
}
