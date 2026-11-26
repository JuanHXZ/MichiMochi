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
      name: 'Favorites',
      description: 'Gestión de productos favoritos del usuario (RF12).',
    },
    {
      name: 'Promotions',
      description: 'Validación y gestión administrativa de códigos promocionales (RF14).',
    },
    {
      name: 'Rewards',
      description: 'Consulta de puntos, niveles e intercambio por recompensas (RF13).',
    },
    {
      name: 'Orders',
      description: 'Endpoints para creación de pedidos con pago, historial, cancelación y seguimiento.',
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
    '/api/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Cerrar sesión',
        description: 'Limpia la cookie de sesión httpOnly del navegador.',
        responses: {
          '200': {
            description: 'Sesión cerrada exitosamente.',
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
    '/api/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Solicitud de recuperación de contraseña (Envío de OTP)',
        description: 'Genera un código OTP de 5 dígitos (expira en 15 min), lo despacha vía Email (o log/mock en dev) y aplica rate-limiting de 60s.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ForgotPasswordRequest',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Código de recuperación generado y enviado exitosamente.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Código de recuperación enviado a tu correo.' },
                    expiresInMinutes: { type: 'number', example: 15 },
                    debugCode: { type: 'string', nullable: true, example: '48291' },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Correo electrónico faltante o con formato inválido.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          '429': {
            description: 'Demasiadas solicitudes. Debe esperar el tiempo de enfriamiento (60s).',
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
    '/api/auth/verify-otp': {
      post: {
        tags: ['Auth'],
        summary: 'Verificación de código OTP',
        description: 'Valida el código de 5 dígitos ingresado por el usuario (máx 5 intentos). Si es correcto, genera un token JWT temporal para restablecimiento.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/VerifyOtpRequest',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Código verificado correctamente. Retorna resetToken.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        verified: { type: 'boolean', example: true },
                        resetToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                        message: { type: 'string', example: 'Código verificado con éxito.' },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Código incorrecto, expirado o número máximo de intentos excedido.',
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
    '/api/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Restablecimiento de contraseña',
        description: 'Actualiza la contraseña del usuario previa validación del resetToken emitido en la verificación del OTP.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ResetPasswordRequest',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Contraseña restablecida exitosamente.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Contraseña actualizada exitosamente.' },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Token inválido o expirado, o contraseña no cumple los requisitos.',
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
        description: 'Obtiene todos los productos disponibles (endpoint público con soporte para filtros).',
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
          '403': {
            description: 'Acceso denegado: requiere rol admin.',
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
    '/api/products/upload-images': {
      post: {
        tags: ['Products'],
        summary: 'Subir imágenes de producto a S3',
        description: 'Recibe hasta 8 imágenes (JPG, PNG, WebP o GIF, máx. 5 MB c/u) y retorna sus URLs públicas en S3. Requiere rol admin.',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': { description: 'Imágenes subidas exitosamente.' },
          '400': { description: 'Formato o tamaño inválido.' },
          '401': { description: 'No autorizado.' },
          '403': { description: 'Acceso denegado: requiere rol admin.' },
        },
      },
    },
    '/api/products/{id}': {
      get: {
        tags: ['Products'],
        summary: 'Consultar producto por ID',
        description: 'Retorna el detalle completo de un producto mediante su identificador único (endpoint público).',
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
    '/api/favorites': {
      get: {
        tags: ['Favorites'],
        summary: 'Listar productos favoritos del usuario',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Lista de favoritos obtenida.' } },
      },
    },
    '/api/favorites/{productId}': {
      post: {
        tags: ['Favorites'],
        summary: 'Agregar producto a favoritos',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Agregado a favoritos.' }, '404': { description: 'Producto no encontrado.' } },
      },
      delete: {
        tags: ['Favorites'],
        summary: 'Eliminar producto de favoritos',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Eliminado de favoritos.' } },
      },
    },
    '/api/promotions/validate': {
      post: {
        tags: ['Promotions'],
        summary: 'Validar código promocional contra el subtotal actual',
        responses: { '200': { description: 'Cupón válido con descuento calculado.' } },
      },
    },
    '/api/promotions': {
      get: {
        tags: ['Promotions'],
        summary: 'Listar cupones (solo admin)',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Listado de cupones.' }, '403': { description: 'Requiere rol admin.' } },
      },
      post: {
        tags: ['Promotions'],
        summary: 'Crear cupón global (solo admin)',
        security: [{ BearerAuth: [] }],
        responses: { '201': { description: 'Cupón creado.' }, '403': { description: 'Requiere rol admin.' } },
      },
    },
    '/api/promotions/{code}': {
      put: {
        tags: ['Promotions'],
        summary: 'Actualizar o activar/desactivar cupón (solo admin)',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Cupón actualizado.' } },
      },
      delete: {
        tags: ['Promotions'],
        summary: 'Eliminar cupón (solo admin)',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Cupón eliminado.' } },
      },
    },
    '/api/rewards/me': {
      get: {
        tags: ['Rewards'],
        summary: 'Consultar saldo de puntos, nivel, cupones e historial',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Resumen de recompensas.' } },
      },
    },
    '/api/rewards/redeem': {
      post: {
        tags: ['Rewards'],
        summary: 'Canjear puntos por un cupón de descuento personal',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Canje realizado.' }, '400': { description: 'Puntos insuficientes.' } },
      },
    },
    '/api/orders': {
      post: {
        tags: ['Orders'],
        summary: 'Crear pedido con pago',
        description: 'Valida stock real, simula la aprobación o rechazo del pago, descuenta inventario y crea una orden en estado RECEIVED.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CreateOrderRequest',
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Pedido creado exitosamente.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/OrderResponse',
                },
              },
            },
          },
          '400': {
            description: 'Pago rechazado, stock insuficiente o datos inválidos.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          '401': {
            description: 'No autorizado.',
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
      get: {
        tags: ['Orders'],
        summary: 'Listar pedidos del usuario autenticado',
        description: 'Retorna el historial de pedidos del cliente (o todos los pedidos si el usuario es admin y pasa ?scope=all).',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'status',
            in: 'query',
            required: false,
            schema: {
              $ref: '#/components/schemas/OrderStatus',
            },
          },
          {
            name: 'scope',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              enum: ['mine', 'all'],
            },
          },
        ],
        responses: {
          '200': {
            description: 'Lista de pedidos.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/OrderListResponse',
                },
              },
            },
          },
          '401': {
            description: 'No autorizado.',
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
    '/api/orders/{id}': {
      get: {
        tags: ['Orders'],
        summary: 'Obtener detalle y seguimiento de pedido',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Detalle de la orden.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/OrderResponse',
                },
              },
            },
          },
          '403': {
            description: 'El pedido pertenece a otro usuario.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          '404': {
            description: 'Pedido no encontrado.',
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
    '/api/orders/{id}/simulate-advance': {
      post: {
        tags: ['Orders'],
        summary: 'Simular avance de estado del pedido',
        description: 'Avanza el pedido un paso en el flujo RECEIVED -> PREPARING -> SHIPPED -> DELIVERED para simulación educativa del cliente.',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Pedido avanzado al siguiente estado.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/OrderResponse',
                },
              },
            },
          },
          '400': {
            description: 'El pedido ya fue entregado o cancelado.',
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
    '/api/orders/{id}/cancel': {
      post: {
        tags: ['Orders'],
        summary: 'Cancelar pedido y restaurar inventario',
        description: 'Permite cancelar pedidos en estado RECEIVED o PREPARING, restaurando el stock descontado.',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Pedido cancelado exitosamente.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/OrderResponse',
                },
              },
            },
          },
          '400': {
            description: 'No se puede cancelar un pedido ya enviado o finalizado.',
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
    '/api/orders/{id}/status': {
      patch: {
        tags: ['Orders'],
        summary: 'Actualizar estado de pedido (Admin)',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UpdateOrderStatusRequest',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Estado actualizado.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/OrderResponse',
                },
              },
            },
          },
          '403': {
            description: 'Se requieren permisos de administrador.',
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
      ForgotPasswordRequest: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email', example: 'juan.perez@example.com' },
        },
      },
      VerifyOtpRequest: {
        type: 'object',
        required: ['email', 'code'],
        properties: {
          email: { type: 'string', format: 'email', example: 'juan.perez@example.com' },
          code: { type: 'string', pattern: '^\\d{5}$', example: '48291' },
        },
      },
      ResetPasswordRequest: {
        type: 'object',
        required: ['email', 'resetToken', 'newPassword'],
        properties: {
          email: { type: 'string', format: 'email', example: 'juan.perez@example.com' },
          resetToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          newPassword: { type: 'string', format: 'password', example: 'NuevaClave#2026' },
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
          role: { type: 'string', enum: ['customer', 'admin'], example: 'customer' },
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
      OrderStatus: {
        type: 'string',
        enum: ['RECEIVED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
        example: 'RECEIVED',
      },
      OrderItem: {
        type: 'object',
        required: ['productId', 'name', 'price', 'quantity', 'subtotal'],
        properties: {
          productId: { type: 'string', example: '1' },
          name: { type: 'string', example: 'Strawberry Dream Mochi' },
          shortName: { type: 'string', example: 'Strawberry Dream' },
          price: { type: 'number', example: 4.25 },
          originalPrice: { type: 'number', example: 4.25 },
          quantity: { type: 'integer', example: 2 },
          flavor: { type: 'string', example: 'classic-pink' },
          image: { type: 'string', example: '/assets/strawberry1.png' },
          subtotal: { type: 'number', example: 8.5 },
        },
      },
      CreateOrderRequest: {
        type: 'object',
        required: ['items', 'shippingAddress', 'payment'],
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              required: ['productId', 'quantity'],
              properties: {
                productId: { type: 'string', example: '1' },
                quantity: { type: 'integer', example: 2 },
                flavor: { type: 'string', example: 'classic-pink' },
              },
            },
          },
          shippingAddress: {
            type: 'object',
            required: ['fullName', 'phone', 'address', 'city'],
            properties: {
              fullName: { type: 'string', example: 'Ana Gómez' },
              phone: { type: 'string', example: '3001234567' },
              address: { type: 'string', example: 'Calle 10 #42-15' },
              city: { type: 'string', example: 'Medellín' },
              notes: { type: 'string', example: 'Portería torre 2' },
            },
          },
          payment: {
            type: 'object',
            required: ['method'],
            properties: {
              method: { type: 'string', enum: ['card', 'nequi', 'pse', 'cash_on_delivery'], example: 'card' },
              cardLast4: { type: 'string', example: '4242' },
              cardHolder: { type: 'string', example: 'ANA GOMEZ' },
              simulateOutcome: { type: 'string', enum: ['approved', 'declined'], example: 'approved' },
            },
          },
          currency: { type: 'string', enum: ['USD', 'COP'], example: 'USD' },
        },
      },
      UpdateOrderStatusRequest: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { $ref: '#/components/schemas/OrderStatus' },
          note: { type: 'string', example: 'Entregado al repartidor' },
        },
      },
      Order: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'ord_1732247123_abc12' },
          orderNumber: { type: 'string', example: 'MM-7K2P9Q' },
          userId: { type: 'string', example: 'uid_123' },
          customerName: { type: 'string', example: 'Ana Gómez' },
          customerEmail: { type: 'string', example: 'ana@example.com' },
          items: { type: 'array', items: { $ref: '#/components/schemas/OrderItem' } },
          subtotal: { type: 'number', example: 8.5 },
          shipping: { type: 'number', example: 2.99 },
          tax: { type: 'number', example: 0.51 },
          savings: { type: 'number', example: 0 },
          total: { type: 'number', example: 12.0 },
          currency: { type: 'string', enum: ['USD', 'COP'], example: 'USD' },
          status: { $ref: '#/components/schemas/OrderStatus' },
          estimatedDelivery: { type: 'string', example: '25-35 min' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      OrderResponse: {
        type: 'object',
        properties: {
          ok: { type: 'boolean', example: true },
          message: { type: 'string' },
          data: { $ref: '#/components/schemas/Order' },
        },
      },
      OrderListResponse: {
        type: 'object',
        properties: {
          ok: { type: 'boolean', example: true },
          total: { type: 'integer', example: 1 },
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/Order' },
          },
        },
      },
    },
  },
};
