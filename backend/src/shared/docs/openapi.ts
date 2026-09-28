export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'MichiMochi API — Dedicated Backend',
    version: '1.0.0',
    description: `API REST centralizada para la plataforma MichiMochi (Web Desktop y Expo Mobile).
Provee servicios unificados de autenticación con JWT, integración con Firebase Admin SDK, catálogo de productos, cálculo de cobertura y gestión de pedidos.`,
    contact: {
      name: 'MichiMochi Development Team',
      email: 'dev@michimochi.com',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Servidor de Desarrollo Local',
    },
  ],
  tags: [
    {
      name: 'Auth',
      description: 'Endpoints de autenticación, registro, login con Google y gestión de sesión.',
    },
    {
      name: 'Products',
      description: 'Endpoints CRUD para la gestión y consulta del catálogo de productos MichiMochi.',
    },
    {
      name: 'System',
      description: 'Verificación de estado y salud del servicio.',
    },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Health Check',
        description: 'Verifica el estado operacional del backend.',
        responses: {
          '200': {
            description: 'Servicio en línea y saludable.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    service: { type: 'string', example: 'michimochi-backend' },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Registro de nuevo usuario',
        description: 'Crea una cuenta en el sistema, registra el perfil en Firestore y devuelve una sesión JWT.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/RegisterRequest',
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Usuario registrado exitosamente con sesión iniciada.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AuthResponse',
                },
              },
            },
          },
          '400': {
            description: 'Error de validación de campos requeridos o formato incorrecto.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          '409': {
            description: 'El correo electrónico ya se encuentra registrado.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Inicio de sesión con credenciales',
        description: 'Autentica a un usuario con correo y contraseña, emitiendo un JWT.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/LoginRequest',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Autenticación exitosa.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AuthResponse',
                },
              },
            },
          },
          '400': {
            description: 'Campos requeridos no enviados.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          '401': {
            description: 'Credenciales inválidas o cuenta inexistente.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/google': {
      post: {
        tags: ['Auth'],
        summary: 'Inicio de sesión / Registro con Google',
        description: 'Verifica el ID Token emitido por el cliente OAuth de Google, sincroniza el perfil y retorna la sesión JWT.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/GoogleAuthRequest',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Autenticación con Google exitosa.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AuthResponse',
                },
              },
            },
          },
          '401': {
            description: 'Token de Google inválido o expirado.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Obtener perfil del usuario autenticado',
        description: 'Retorna los datos del usuario en sesión a partir del Bearer Token enviado en las cabeceras.',
        security: [
          {
            BearerAuth: [],
          },
        ],
        responses: {
          '200': {
            description: 'Datos del perfil recuperados.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        user: { $ref: '#/components/schemas/UserProfile' },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'No autorizado / Token ausente o expirado.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/api/products': {
      get: {
        tags: ['Products'],
        summary: 'Listar productos del catálogo',
        description: 'Obtiene todos los productos disponibles con soporte para filtros por categoría, búsqueda y disponibilidad.',
        security: [
          {
            BearerAuth: [],
          },
        ],
        parameters: [
          {
            name: 'category',
            in: 'query',
            description: 'Filtrar por categoría (ej: Strawberry, Mango, Matcha)',
            required: false,
            schema: { type: 'string', example: 'Strawberry' },
          },
          {
            name: 'search',
            in: 'query',
            description: 'Término de búsqueda en nombre, descripción o tags',
            required: false,
            schema: { type: 'string', example: 'Matcha' },
          },
          {
            name: 'featured',
            in: 'query',
            description: 'Filtrar solo productos destacados',
            required: false,
            schema: { type: 'boolean', example: true },
          },
          {
            name: 'inStock',
            in: 'query',
            description: 'Filtrar productos con existencias disponibles',
            required: false,
            schema: { type: 'boolean', example: true },
          },
        ],
        responses: {
          '200': {
            description: 'Lista de productos obtenida exitosamente.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ProductListResponse',
                },
              },
            },
          },
          '401': {
            description: 'No autorizado / Token ausente o inválido.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Products'],
        summary: 'Crear nuevo producto en el catálogo',
        description: 'Agrega un nuevo producto con su información nutricional, sabores, precio e inventario.',
        security: [
          {
            BearerAuth: [],
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CreateProductRequest',
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Producto creado exitosamente en el catálogo.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ProductResponse',
                },
              },
            },
          },
          '400': {
            description: 'Datos del producto inválidos o incompletos.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          '401': {
            description: 'No autorizado / Token ausente o inválido.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          '409': {
            description: 'Ya existe un producto con el ID proporcionado.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/api/products/{id}': {
      get: {
        tags: ['Products'],
        summary: 'Consultar producto por ID',
        description: 'Retorna el detalle completo de un producto mediante su identificador único.',
        security: [
          {
            BearerAuth: [],
          },
        ],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Identificador único del producto',
            schema: { type: 'string', example: '1' },
          },
        ],
        responses: {
          '200': {
            description: 'Producto recuperado exitosamente.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ProductResponse',
                },
              },
            },
          },
          '401': {
            description: 'No autorizado / Token ausente o inválido.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          '404': {
            description: 'Producto no encontrado en el catálogo.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
      put: {
        tags: ['Products'],
        summary: 'Actualizar producto por ID',
        description: 'Actualiza los campos de un producto existente en el catálogo.',
        security: [
          {
            BearerAuth: [],
          },
        ],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Identificador único del producto a actualizar',
            schema: { type: 'string', example: '1' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UpdateProductRequest',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Producto actualizado exitosamente.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ProductResponse',
                },
              },
            },
          },
          '400': {
            description: 'Datos de actualización inválidos.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          '401': {
            description: 'No autorizado / Token ausente o inválido.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          '404': {
            description: 'Producto no encontrado.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Products'],
        summary: 'Eliminar producto por ID',
        description: 'Elimina de forma permanente un producto del catálogo de MichiMochi.',
        security: [
          {
            BearerAuth: [],
          },
        ],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Identificador único del producto a eliminar',
            schema: { type: 'string', example: '1' },
          },
        ],
        responses: {
          '200': {
            description: 'Producto eliminado exitosamente del catálogo.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ProductDeleteResponse',
                },
              },
            },
          },
          '401': {
            description: 'No autorizado / Token ausente o inválido.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          '404': {
            description: 'Producto no encontrado.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Ingresa el token JWT obtenido al hacer login o registro. Ejemplo: `Bearer <token>`',
      },
    },
    schemas: {
      RegisterRequest: {
        type: 'object',
        required: ['fullName', 'email', 'password', 'acceptedTerms'],
        properties: {
          fullName: { type: 'string', example: 'Juan Pérez' },
          email: { type: 'string', format: 'email', example: 'juan.perez@example.com' },
          phone: { type: 'string', example: '3001234567' },
          address: { type: 'string', example: 'Calle 123 #45-67' },
          city: { type: 'string', example: 'Bogotá' },
          password: { type: 'string', format: 'password', example: 'Secr3t#2026' },
          acceptedTerms: { type: 'boolean', example: true },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'juan.perez@example.com' },
          password: { type: 'string', format: 'password', example: 'Secr3t#2026' },
        },
      },
      GoogleAuthRequest: {
        type: 'object',
        required: ['idToken'],
        properties: {
          idToken: { type: 'string', example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjEy...' },
        },
      },
      UserProfile: {
        type: 'object',
        properties: {
          uid: { type: 'string', example: 'g8Xq9L2zK1...' },
          email: { type: 'string', format: 'email', example: 'juan.perez@example.com' },
          fullName: { type: 'string', example: 'Juan Pérez' },
          phone: { type: 'string', example: '3001234567' },
          address: { type: 'string', example: 'Calle 123 #45-67' },
          city: { type: 'string', example: 'Bogotá' },
          photoURL: { type: 'string', nullable: true, example: 'https://lh3.googleusercontent.com/...' },
          provider: { type: 'string', enum: ['password', 'google'], example: 'password' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          ok: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              user: { $ref: '#/components/schemas/UserProfile' },
              tokens: {
                type: 'object',
                properties: {
                  accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1Ni...' },
                  expiresIn: { type: 'string', example: '7d' },
                },
              },
            },
          },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          ok: { type: 'boolean', example: false },
          error: { type: 'string', example: 'Descripción detallada del error' },
          details: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string', example: 'email' },
                message: { type: 'string', example: 'Correo electrónico no válido' },
              },
            },
          },
        },
      },
      ProductFlavor: {
        type: 'object',
        required: ['id', 'name'],
        properties: {
          id: { type: 'string', example: 'classic-pink' },
          name: { type: 'string', example: 'Classic Pink' },
          description: { type: 'string', example: 'Sweet strawberry infused' },
          color: { type: 'string', example: '#ff69b4' },
        },
      },
      ProductNutritionalInfo: {
        type: 'object',
        properties: {
          calories: { type: 'number', example: 160 },
          protein: { type: 'string', example: '2g' },
          carbs: { type: 'string', example: '32g' },
          fat: { type: 'string', example: '2g' },
          sugar: { type: 'string', example: '20g' },
        },
      },
      Product: {
        type: 'object',
        required: ['id', 'name', 'description', 'price', 'category', 'createdAt'],
        properties: {
          id: { type: 'string', example: '1' },
          name: { type: 'string', example: 'Strawberry Dream Mochi' },
          shortName: { type: 'string', example: 'Strawberry Dream' },
          description: { type: 'string', example: 'Fresh whole strawberry with sweet red bean paste' },
          longDescription: { type: 'string', example: 'A cloud-like pillow of premium rice dough...' },
          price: { type: 'number', example: 4.25 },
          originalPrice: { type: 'number', example: 4.25 },
          discount: { type: 'number', example: 0 },
          category: { type: 'string', example: 'Strawberry' },
          image: { type: 'string', example: '/assets/strawberry1.png' },
          images: {
            type: 'array',
            items: { type: 'string' },
            example: ['/assets/strawberry1.png', '/assets/strawberry2.png'],
          },
          featured: { type: 'boolean', example: true },
          inStock: { type: 'boolean', example: true },
          stock: { type: 'integer', example: 32 },
          rating: { type: 'number', example: 4.9 },
          reviewCount: { type: 'integer', example: 412 },
          flavors: {
            type: 'array',
            items: { $ref: '#/components/schemas/ProductFlavor' },
          },
          ingredients: {
            type: 'array',
            items: { type: 'string' },
            example: ['Mochiko sweet rice flour', 'Fresh California strawberries'],
          },
          allergens: {
            type: 'array',
            items: { type: 'string' },
            example: ['None'],
          },
          nutritionalInfo: {
            $ref: '#/components/schemas/ProductNutritionalInfo',
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            example: ['Best Seller', 'Fresh Fruit'],
          },
          preparationTime: { type: 'string', example: 'Made to order' },
          bestServedAt: { type: 'string', example: 'Chilled for best texture' },
          createdAt: { type: 'string', format: 'date-time', example: '2026-01-01T00:00:00.000Z' },
          updatedAt: { type: 'string', format: 'date-time', example: '2026-01-01T00:00:00.000Z' },
        },
      },
      CreateProductRequest: {
        type: 'object',
        required: ['name', 'description', 'price', 'category'],
        properties: {
          name: { type: 'string', example: 'Blueberry Bliss Mochi' },
          shortName: { type: 'string', example: 'Blueberry Bliss' },
          description: { type: 'string', example: 'Delicious fresh blueberry mochi with sweet bean paste' },
          longDescription: { type: 'string', example: 'Artisanal mochi crafted with mountain blueberries...' },
          price: { type: 'number', example: 4.8 },
          originalPrice: { type: 'number', example: 5.0 },
          discount: { type: 'number', example: 4 },
          category: { type: 'string', example: 'Berry' },
          image: { type: 'string', example: '/assets/blueberry1.png' },
          images: {
            type: 'array',
            items: { type: 'string' },
            example: ['/assets/blueberry1.png'],
          },
          featured: { type: 'boolean', example: false },
          inStock: { type: 'boolean', example: true },
          stock: { type: 'integer', example: 20 },
          flavors: {
            type: 'array',
            items: { $ref: '#/components/schemas/ProductFlavor' },
          },
          ingredients: {
            type: 'array',
            items: { type: 'string' },
            example: ['Sweet rice flour', 'Blueberries', 'Organic cane sugar'],
          },
          allergens: {
            type: 'array',
            items: { type: 'string' },
            example: ['None'],
          },
          nutritionalInfo: {
            $ref: '#/components/schemas/ProductNutritionalInfo',
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            example: ['New', 'Seasonal'],
          },
        },
      },
      UpdateProductRequest: {
        type: 'object',
        description: 'Campos opcionales para actualizar el producto.',
        properties: {
          name: { type: 'string', example: 'Strawberry Deluxe Mochi' },
          shortName: { type: 'string', example: 'Strawberry Deluxe' },
          description: { type: 'string', example: 'Fresh strawberry with organic cream' },
          price: { type: 'number', example: 5.25 },
          category: { type: 'string', example: 'Strawberry' },
          inStock: { type: 'boolean', example: true },
          stock: { type: 'integer', example: 45 },
          featured: { type: 'boolean', example: true },
        },
      },
      ProductResponse: {
        type: 'object',
        properties: {
          ok: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Operación realizada exitosamente.' },
          data: {
            $ref: '#/components/schemas/Product',
          },
        },
      },
      ProductListResponse: {
        type: 'object',
        properties: {
          ok: { type: 'boolean', example: true },
          total: { type: 'integer', example: 3 },
          data: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Product',
            },
          },
        },
      },
      ProductDeleteResponse: {
        type: 'object',
        properties: {
          ok: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Producto eliminado exitosamente del catálogo.' },
          data: {
            type: 'object',
            properties: {
              id: { type: 'string', example: '1' },
              name: { type: 'string', example: 'Strawberry Dream Mochi' },
            },
          },
        },
      },
    },
  },
};
