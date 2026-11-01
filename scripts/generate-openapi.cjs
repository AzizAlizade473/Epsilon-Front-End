const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const YAML = require('yaml');
const { isDeepStrictEqual } = require('node:util');
const { z } = require('zod');
// Build-time only: execute the repository's actual Zod declarations, not a copy.
function loadSource(relative) {
  const exports = {};
  const filename = path.resolve(relative);
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  vm.runInNewContext(
    compiled,
    {
      exports,
      require: (name) =>
        name.startsWith('@/')
          ? loadSource('src/' + name.slice(2) + '.ts')
          : require(name),
    },
    { filename },
  );
  return exports;
}
const contracts = loadSource('src/services/contracts/index.ts');
const { serverErrorCodes } = loadSource('src/services/http/errors.ts');
const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const string = { type: 'string', minLength: 1 };
const object = (properties, required = Object.keys(properties)) => ({
  type: 'object',
  additionalProperties: false,
  properties,
  required,
});
const json = (schema) => ({ 'application/json': { schema } });
const schemaNames = {
  OtpChallenge: 'otpChallengeSchema',
  Identity: 'identitySchema',
  User: 'userSchema',
  Session: 'sessionSchema',
  AuthResult: 'authResultSchema',
  Config: 'configSchema',
  Restaurant: 'restaurantSchema',
  Receipt: 'receiptSchema',
  ReceiptItem: 'receiptItemSchema',
  PurchaseReference: 'purchaseReferenceSchema',
  FeedbackInput: 'feedbackInputSchema',
  FeedbackResult: 'feedbackResultSchema',
  FeedbackReview: 'feedbackReviewSchema',
  Wallet: 'walletSchema',
  WalletTransaction: 'walletTransactionSchema',
  NotificationPreferences: 'notificationPreferencesSchema',
};
const schemas = Object.fromEntries(
  Object.entries(schemaNames).map(([name, key]) => {
    const schema = z.toJSONSchema(contracts[key], { target: 'draft-2020-12' });
    delete schema.$schema;
    return [name, schema];
  }),
);
schemas.Config.properties.minAppVersion.description =
  'Strict semantic version, validated by isAppVersion; server dictates minimum. JSON Schema alone does not express all numeric/prerelease checks.';
schemas.FeedbackResult.properties.reward.allOf = [
  {
    if: { properties: { status: { const: 'confirmed' } } },
    then: {
      properties: {
        amountMinor: {
          type: 'integer',
          minimum: Number.MIN_SAFE_INTEGER,
          maximum: Number.MAX_SAFE_INTEGER,
        },
      },
    },
  },
  {
    if: { properties: { status: { const: 'none' } } },
    then: { properties: { amountMinor: { type: 'null' } } },
  },
];
schemas.ProfileUpdate = {
  oneOf: [
    object({
      user: ref('User'),
      nextStep: { enum: ['profile', 'phone', 'home'] },
    }),
    ref('User'),
  ],
  description:
    'Canonical envelope first; legacy User-only response is decoded explicitly.',
};
schemas.OtpRequest = object({
  phone: { type: 'string', pattern: '^\\+994[0-9]{9}$' },
});
schemas.OtpVerify = object({
  ...schemas.OtpRequest.properties,
  code: { type: 'string', pattern: '^[0-9]{6}$' },
});
schemas.ProfilePatch = object(
  {
    firstName: { type: 'string', minLength: 2, maxLength: 40 },
    lastName: { type: 'string', minLength: 2, maxLength: 40 },
    birthDate: { type: 'string', format: 'date' },
    language: { enum: ['az', 'en', 'ru'] },
  },
  [],
);
schemas.Error = object({
  error: object(
    {
      code: { type: 'string', enum: [...serverErrorCodes] },
      message: { type: 'string' },
      requestId: { type: 'string', minLength: 1, maxLength: 128 },
      retryAfterSeconds: {
        type: 'integer',
        minimum: 0,
        maximum: Number.MAX_SAFE_INTEGER,
      },
    },
    ['code', 'message', 'requestId'],
  ),
});
const page = (name) =>
  object({
    items: { type: 'array', items: ref(name) },
    nextCursor: { type: ['string', 'null'] },
  });
schemas.RestaurantPage = page('Restaurant');
schemas.FeedbackPage = page('FeedbackReview');
schemas.TransactionPage = page('WalletTransaction');
schemas.RestaurantList = {
  oneOf: [ref('RestaurantPage'), { type: 'array', items: ref('Restaurant') }],
  description: 'Prefer cursor page; legacy bare array remains accepted.',
};
const parameters = {
  Language: {
    name: 'Accept-Language',
    in: 'header',
    required: false,
    schema: { enum: ['az', 'en', 'ru'], default: 'az' },
  },
  RequestId: {
    name: 'X-Request-Id',
    in: 'header',
    required: false,
    schema: string,
  },
  Idempotency: {
    name: 'Idempotency-Key',
    in: 'header',
    required: true,
    schema: string,
    description:
      'User/operation/payload-bound durable key. Same key and payload MUST replay stored result after commit; do not create another reward.',
  },
  Id: {
    name: 'id',
    in: 'path',
    required: true,
    schema: {
      type: 'string',
      minLength: 1,
      maxLength: 128,
      pattern: '^[A-Za-z0-9_-]+$',
    },
  },
  Cursor: { name: 'cursor', in: 'query', required: false, schema: string },
  Limit: {
    name: 'limit',
    in: 'query',
    required: false,
    schema: { type: 'integer', minimum: 1, maximum: 50 },
  },
  Search: {
    name: 'search',
    in: 'query',
    required: false,
    schema: { type: 'string' },
  },
};
const paths = {};
function operation(
  method,
  route,
  id,
  response,
  body,
  publicAccess = false,
  extra = [],
) {
  const mutation = method !== 'get';
  const params = [
    'Language',
    'RequestId',
    ...(mutation ? ['Idempotency'] : []),
    ...(route.includes('{id}') ? ['Id'] : []),
    ...extra,
  ];
  const responses = {
    200: {
      description: response
        ? 'Validated server projection'
        : 'Successful empty result; JSON null is accepted for compatibility',
      ...(response
        ? { content: json(ref(response)) }
        : { content: json({ type: 'null' }) }),
      headers: {
        'X-Request-Id': { schema: string },
        Date: {
          schema: { type: 'string' },
          description:
            'HTTP server date anchors client time; authorization/expiry remain server enforced.',
        },
      },
    },
    ...(!response ? { 204: { description: 'Successful empty response' } } : {}),
    429: {
      description: 'Rate limited; delta-seconds Retry-After',
      headers: { 'Retry-After': { schema: { type: 'integer', minimum: 0 } } },
      content: json(ref('Error')),
    },
    default: {
      description:
        'Machine-readable error. HTTP status remains authoritative; 403 is generic forbidden, unknown codes never become typed domain codes.',
      content: json(ref('Error')),
    },
  };
  paths[route] ??= {};
  paths[route][method] = {
    operationId: id,
    ...(publicAccess ? { security: [] } : {}),
    parameters: params.map((name) => ({
      $ref: `#/components/parameters/${name}`,
    })),
    ...(body
      ? {
          requestBody: {
            required: true,
            content: json(typeof body === 'string' ? ref(body) : body),
          },
        }
      : {}),
    responses,
  };
}
operation(
  'post',
  '/auth/otp/request',
  'requestOtp',
  'OtpChallenge',
  'OtpRequest',
  true,
);
operation(
  'post',
  '/auth/otp/verify',
  'verifyOtp',
  'AuthResult',
  'OtpVerify',
  true,
);
operation(
  'post',
  '/auth/google',
  'googleSignIn',
  'AuthResult',
  object({ idToken: string }),
  true,
);
operation(
  'post',
  '/auth/refresh',
  'refreshSession',
  'Session',
  object({ refreshToken: string }),
  true,
);
operation('post', '/auth/logout', 'logout', null);
operation(
  'post',
  '/me/phone/otp/request',
  'requestPhoneLinkOtp',
  'OtpChallenge',
  'OtpRequest',
);
operation(
  'post',
  '/me/phone/otp/verify',
  'verifyPhoneLink',
  'User',
  'OtpVerify',
);
operation('get', '/me', 'currentUser', 'User');
operation('patch', '/me', 'updateProfile', 'ProfileUpdate', 'ProfilePatch');
operation('delete', '/me', 'deleteAccount', null);
paths['/me'].delete.description =
  'Backend MUST enforce recentAuth. Android currently sends no body. Apple authorization-code deletion/revocation is deferred with Apple sign-in.';
operation('get', '/config', 'configuration', 'Config', null, true);
operation('get', '/restaurants', 'restaurants', 'RestaurantList', null, false, [
  'Search',
  'Cursor',
  'Limit',
]);
operation('get', '/restaurants/{id}', 'restaurant', 'Restaurant');
operation(
  'post',
  '/receipts/resolve',
  'resolvePurchaseReference',
  'Receipt',
  'PurchaseReference',
);
operation('get', '/receipts/{id}', 'receipt', 'Receipt');
operation(
  'post',
  '/feedback',
  'submitDishFeedback',
  'FeedbackResult',
  'FeedbackInput',
);
operation('get', '/feedback', 'myReviews', 'FeedbackPage', null, false, [
  'Cursor',
  'Limit',
]);
operation('get', '/wallet', 'universalWallet', 'Wallet');
operation(
  'get',
  '/wallet/transactions',
  'walletTransactions',
  'TransactionPage',
  null,
  false,
  ['Cursor', 'Limit'],
);
operation(
  'get',
  '/wallet/transactions/{id}',
  'walletTransaction',
  'WalletTransaction',
);
operation(
  'get',
  '/me/notification-settings',
  'notificationPreferences',
  'NotificationPreferences',
);
operation(
  'put',
  '/me/notification-settings',
  'saveNotificationPreferences',
  'NotificationPreferences',
  'NotificationPreferences',
);
operation(
  'post',
  '/devices',
  'registerPushDevice',
  null,
  object({ token: string }),
);
const document = {
  openapi: '3.1.0',
  info: {
    title: 'Epsilon mobile backend handoff',
    version: '0.1.0',
    description:
      'LIVE BACKEND CONTRACT VERIFICATION PENDING. Generated response shapes reflect current Zod decoders; BUSINESS_RULES.md defines additional server MUSTs. Apple auth is deferred, not an active endpoint. No redemption API exists. See API_CONTRACT.md for compatibility and unresolved decisions.',
  },
  servers: [{ url: '/v1' }],
  security: [{ bearerAuth: [] }],
  paths,
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer' } },
    parameters,
    schemas,
  },
};
if (process.argv.includes('--check')) {
  const wire = ts.createSourceFile(
    'services.ts',
    fs.readFileSync('src/services/http/services.ts', 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  );
  const wirePaths = new Set();
  function visit(node) {
    if (ts.isStringLiteral(node) && node.text.startsWith('/'))
      wirePaths.add(node.text.split('?')[0]);
    if (ts.isTemplateExpression(node) && node.head.text.startsWith('/')) {
      const prefix = node.head.text.split('?')[0];
      wirePaths.add(node.head.text.includes('?') ? prefix : prefix + '{id}');
    }
    ts.forEachChild(node, visit);
  }
  visit(wire);
  if (!isDeepStrictEqual([...wirePaths].sort(), Object.keys(paths).sort()))
    throw new Error(
      'HTTP adapter path inventory differs from OpenAPI; review the contract handoff.',
    );
  if (
    !isDeepStrictEqual(
      JSON.parse(JSON.stringify(document)),
      YAML.parse(fs.readFileSync('docs/openapi.yaml', 'utf8')),
    )
  ) {
    console.error(
      'OpenAPI drift: run npm run contract:generate and review the handoff.',
    );
    process.exitCode = 1;
  } else
    console.log(
      'OpenAPI matches current schemas and handoff operation definitions.',
    );
} else
  fs.writeFileSync(
    'docs/openapi.yaml',
    '# Generated by scripts/generate-openapi.cjs; review API_CONTRACT.md before changing.\n' +
      YAML.stringify(document),
  );
