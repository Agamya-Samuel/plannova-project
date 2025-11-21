import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

// Force Node.js runtime (not Edge) so the package works
export const runtime = 'nodejs';

const INDIA_DIR = path.join(
  process.cwd(),
  'node_modules',
  '@countrystatecity',
  'countries',
  'dist',
  'data',
  'India-IN'
);

const STATES_FILE_PATH = path.join(INDIA_DIR, 'states.json');
let cachedStates: Array<{ iso2: string; name: string }> | null = null;

async function loadStatesFromPackage() {
  if (cachedStates) {
    return cachedStates;
  }

  const fileContent = await fs.readFile(STATES_FILE_PATH, 'utf-8');
  const states = JSON.parse(fileContent);

  if (!Array.isArray(states)) {
    throw new Error('Invalid states data format inside package');
  }

  cachedStates = states.map((state) => ({
    iso2: state.iso2,
    name: state.name
  }));

  return cachedStates;
}

// API route to fetch Indian states server-side
export async function GET() {
  try {
    const states = await loadStatesFromPackage();

    return NextResponse.json({
      success: true,
      states,
      count: states.length
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API][States] Failed to load states:', message);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch states',
        message
      },
      { status: 500 }
    );
  }
}

