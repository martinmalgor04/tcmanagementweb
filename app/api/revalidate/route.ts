import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

// El secreto que usaremos para validar que la solicitud viene de Sanity
const SANITY_WEBHOOK_SECRET = process.env.SANITY_WEBHOOK_SECRET || 'tu-secreto-aqui';

export async function POST(request: NextRequest) {
  try {
    // Verificar el secreto para asegurarse que es una solicitud válida de Sanity
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    
    if (secret !== SANITY_WEBHOOK_SECRET) {
      return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
    }

    // Obtener el cuerpo de la solicitud que contendrá detalles sobre qué cambió
    const body = await request.json();
    console.log('Revalidation triggered by Sanity webhook:', body);
    
    // Revalidar las rutas principales
    const pathsToRevalidate = ['/', '/women', '/men', '/portfolio'];
    
    // Si el webhook incluye información sobre el tipo de documento que cambió,
    // podríamos ser más específicos con qué rutas revalidar
    if (body._type) {
      // Ejemplo: si se actualiza un modelo, revalidar solo esa categoría
      if (body._type === 'model' && body.gender) {
        pathsToRevalidate.push(`/${body.gender.toLowerCase()}`);
        
        // Si hay un slug, también revalidar la página del modelo
        if (body.slug?.current) {
          pathsToRevalidate.push(`/${body.gender.toLowerCase()}/${body.slug.current}`);
        }
      }
      
      // Si se actualiza una campaña, revalidar el portafolio
      if (body._type === 'campaign') {
        pathsToRevalidate.push('/portfolio');
        
        // Si hay un slug, también revalidar la página de la campaña
        if (body.slug?.current) {
          pathsToRevalidate.push(`/portfolio/${body.slug.current}`);
        }
      }
    }
    
    // Revalidar todas las rutas afectadas
    pathsToRevalidate.forEach(path => {
      console.log(`Revalidating: ${path}`);
      revalidatePath(path);
    });
    
    return NextResponse.json({ 
      revalidated: true, 
      message: 'Revalidation triggered successfully',
      paths: pathsToRevalidate
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