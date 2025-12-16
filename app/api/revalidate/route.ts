import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

// Endpoint GET para verificar que el webhook está funcionando
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Revalidation endpoint is working',
    configured: !!process.env.SANITY_WEBHOOK_SECRET 
  });
}

export async function POST(request: NextRequest) {
  try {
    // Verificar que el secret está configurado (validación en runtime)
    const SANITY_WEBHOOK_SECRET = process.env.SANITY_WEBHOOK_SECRET;
    
    if (!SANITY_WEBHOOK_SECRET) {
      console.error('SANITY_WEBHOOK_SECRET environment variable is not configured');
      return NextResponse.json({ message: 'Server configuration error' }, { status: 500 });
    }

    // Verificar el secreto para asegurarse que es una solicitud válida de Sanity
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    
    if (secret !== SANITY_WEBHOOK_SECRET) {
      console.error('Invalid secret provided');
      return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
    }

    // Obtener el cuerpo de la solicitud que contendrá detalles sobre qué cambió
    const body = await request.json();
    console.log('Revalidation triggered by Sanity webhook:', JSON.stringify(body, null, 2));
    
    // Usar un Set para evitar rutas duplicadas
    const pathsToRevalidate = new Set(['/', '/women', '/men', '/portfolio']);
    
    // Si el webhook incluye información sobre el tipo de documento que cambió
    if (body._type) {
      const docType = body._type;
      
      // Modelo actualizado
      if (docType === 'model') {
        // Revalidar ambas páginas de género por si acaso
        pathsToRevalidate.add('/women');
        pathsToRevalidate.add('/men');
        
        // Si tiene género específico y slug, revalidar la página individual
        if (body.gender && body.slug?.current) {
          const genderPath = body.gender.toLowerCase();
          pathsToRevalidate.add(`/${genderPath}/${body.slug.current}`);
        }
      }
      
      // Campaña actualizada
      if (docType === 'campaign') {
        pathsToRevalidate.add('/portfolio');
        
        if (body.slug?.current) {
          pathsToRevalidate.add(`/portfolio/${body.slug.current}`);
        }
      }
      
      // About o US Section actualizado - afecta la página principal
      if (docType === 'about' || docType === 'usSection' || docType === 'settings') {
        pathsToRevalidate.add('/');
      }
    }
    
    // Convertir Set a Array y revalidar todas las rutas
    const pathsArray = Array.from(pathsToRevalidate);
    
    for (const path of pathsArray) {
      console.log(`Revalidating: ${path}`);
      // Usar 'layout' para revalidación más agresiva que incluye el layout completo
      revalidatePath(path, 'layout');
    }
    
    console.log(`Successfully revalidated ${pathsArray.length} paths`);
    
    return NextResponse.json({ 
      revalidated: true, 
      message: 'Revalidation triggered successfully',
      paths: pathsArray,
      documentType: body._type || 'unknown'
    });
  } catch (error) {
    console.error('Error during revalidation:', error);
    return NextResponse.json({ 
      revalidated: false, 
      message: 'Error during revalidation',
      error: (error as Error).message
    }, { status: 500 });
  }
} 