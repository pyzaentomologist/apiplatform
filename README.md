# Kurs API Platform 3

## Part 1: Mythically Good RESTful APIs

### 01. Installing API Platform

Rzeczy trudne do utrzymania w klasycznym API:

- Spójna serializacja
- Dodanie dodatkowych pól do API
- Interaktywna, generowana automatycznie dokumentacja
- Paginacja
- Filtry i Sortowanie
- Walidacja
- Uzgadnianie typu treści (JSON, CSV, Emoji)

> composer install
> symfony serve -d
> composer require api

Komenda **composer require api** jest aliasem dla **composer require api-platform/api-pack**

repo apiplatform1

### 02. Tworzenie pierwszego ApiResource

Dodanie próbnej bazy odbywa sie za pomocą dwóch komend. Pierwsza pobiera paczkę maker:

> composer require maker --dev

Druga tworzy encje:

> php bin/console make:entity

Do połaczenia z bazą danych potrzebne jest odpalenie utworzonego przez symfony kontenera Dockera:

> docker-compose up -d

Utworzenie migracji:

> symfony console make:migration

Podczas tworzenia migracji za pomocą dockera wystąpił błąd polegający na zamieszczeniu w zliennej DATABASE_URL ip 127.0.0.1 zamiast nazwy serwisu z bazą: database

Oraz uruchomienie migracji:

> symfony console doctrine:migrations:migrate

Połączenie api przez migrację następuje przez dodanie #[ApiResource]:

```
#[ORM\Entity(repositoryClass: DragonTreasureRepository::class)]
#[ApiResource]
class DragonTreasure
```

### 03. Swagger UI: Interactive Docs

Podspodem layout apiplatform ma otwartoźródłowy Swagger UI.

Komenda pozwala na podejrzenie wszystkich endpointów:

> docker-compose exec php php bin/console debug:router

Struktura końcówek jest ustalona podczas tworzenia nowego projektu w /config/routes/api_platform.yaml
Uruchomienie końcówek jest przez dodanie #[ApiResource].

/config/routes/api_platform.yaml:

```
api_platform:
    resource: .
    type: api_platform
    prefix: /api
```

Apiplatform domyślnie nie wspiera formatu json, prtzeba go dodać w /config/packages/api_platform.yaml

```
api_platform:
    title: Hello API Platform
    version: 1.0.0
    formats:
        jsonld: ['application/ld+json']
        json: ['application/json']
    docs_formats:
        json: ['application/json']
        jsonld: ['application/ld+json']
        jsonopenapi: ['application/vnd.openapi+json']
        html: ['text/html']
    defaults:
        stateless: true
        cache_headers:
            vary: ['Content-Type', 'Authorization', 'Origin']
        extra_properties:
            standard_put: true
            rfc_7807_compliant_errors: true
    event_listeners_backward_compatibility_layer: false
    keep_legacy_inflector: false
```

### 04. The Powerfull OpenAPI Spec

Dokumentacja Swaggera jest pod linkiem:

[https://petstore3.swagger.io]

Dokumentacja api jest pod /api/docs.jsonopenapi

Specyfikacja Api Platform jest na bazie OpenAPI, co daje szerokie możliwości dostosowania np. przez dodanie własnego layoutu api przy pomocy Stoplight [https://stoplight.io/].

Schema jest opisem w dokumentacji, który mówi z jakimi typami mamy do czynienia i jakie są komentarze do sprawdzanej wartości.

### 05. JSON-LD: Giving Meaning to your Data

RDF (Resource Description Framework) - zestaw zasad dzięki którym opisujemy znaczenie danych, dzięki temu komputer może je zrozumieć.
W HTMLu rdf można dodać jako atrybut:

```
<p typeof="http://schema.org/Person">
  Tekst
</p>
```

JSON-LD ma podobne zachowanie dla API, ale posługuje sie prefiksem przed nazwą wartości: @.

Przykładem jest "@id": "/api/dragon_treasures/1", któy jest URLem (IRI).

Dodając description do ApiResource dodaję opis do Schemy oraz do hydra:description

```
#[ApiResource(
    description: "A rare and valuable treasure"
)]
```

W praktyce JSON-LD odpowiada za pola @id, @type i @context w naszym API.

### 06. Hydra: Describing API Classes, Operations & More

Hydra jest dodatkowym opisem dodanym do OpenAPI. Efektem końcowym jest system, który w pełni opisuje nasze API. Opisują modele, które mamy, operacje.
Możemy wykorzystać @context, aby wskazać inną dokumentację, aby uzyskać więcej metadanych lub więcej kontekstu.

Co opisuje Entrypoint?
Po pierwsze, interfejs API może mieć stronę główną, która służy jako sposób komunikowania się, jakie punkty końcowe lub zasoby znajdują się w interfejsie API.
Po drugie, w platformie API „strona główna” sama w sobie jest „zasobem” (Entrypointem).
Mało praktyczne, dopóki jakiś robot nie skanuje api.

### 07. API Debugging with the Profiler

Instalacja Profilera (WebDebugToolbar):

> composer require debug

### 08. Operations / Endpoints

Operacje PUT i PATCH działają tak samo w apiplatform, służą do aktualizacji dancyh.

W profilerze można sprawdzić listę operacji dla danej końcówki /_profiler/2e5a30?panel=api_platform.data_collector.request

W dokumnetacji api możemy zarządzać obiektamiz a pomocą ApiResource:

```
#[ApiResource(
    shortName: "Treasure",
    description: "A rare and valuable treasure",
    operations: [
        new Get(uriTemplate: '/dragon-plunder/{id}'),
        new GetCollection(uriTemplate: '/dragon-plunder'),
        new Post(),
        New Put(),
        new Patch(),
        new Delete()
    ]
)]
```

- shortName to nazwa końcówki,
- description to opis w schemie
- operations to lista dopuszczonych operacji na bazie za pomocą apiplatform
  - każdej z operacji można nadać nazwę ręcznie, przez określenie jej uriTemplate

W symfony można dodac bibliotekę do automatycznego wyliczania ile czasu upłynęło od określonej daty:

> composer require nesbot/carbon

### 09. The Serializer

Serializer tłumaczy obiekt na JSON (również YAML, XML itd.). Dzieje się tak zięki etapowi pośredniemu - dekodowaniu i kodowaniu na tablicę oraz normalizacji i denormalizacji tablicy na obiekt.

[Schemat działania serializera](https://symfony.com/doc/current/serializer.html#the-serialization-process-normalizers-and-encoders)

Za tłumaczenie nowych linii w znaczniki br odpowiada nl2br()

Dodanie nowej wirtualnej właściwości w put/post/patch odbywa się przez dodanie settera

```
public function setTextDescription(string $description): static
{
    $this->description = nl2br($description);

    return $this;
}
```

Patch może zmienić tylko jedną właściwość obiektu:

```
{
  "textDescription": "Scrooge's gold\n\nshe's gonna be mad!"
}
```

Zmieniono właściwości setterów (usunięto setDescription())

Następnie trzeba było utworzyć i wykonać migrację:

> docker exec php-apliplatform1 symfony console make:migration
> docker exec php-apliplatform1 symfony console do:mi:mi

W api mogą zostać zwrócone pola:

- obsłużone przez getter (samo pole nie musi istnieć)
- z włąściwością public

### 10. Serialization Groups: Choosing Fields

Wybieranie pól które mają wyświetlać się w metodach API odbywa się za pomocą normalizationContext i denormalizationContext:

```
#[ApiResource(
    shortName: "Treasure",
    description: "A rare and valuable treasure",
    operations: [
        new Get(),
        new GetCollection(),
        new Post(),
        New Put(),
        new Patch(),
        new Delete()
    ],
    normalizationContext: [
        'groups' => ['treasure:read']
    ],
    denormalizationContext: [
        'groups' => ['treasure:write']
    ]
)]

[...]

    #[ORM\Column]
    #[Groups(['treasure:read', 'treasure:write'])]
    private ?int $value = null;

    #[Groups('treasure:write')]
    public function setTextDescription(string $description): static
    {
        $this->description = nl2br($description);

        return $this;
    }
```

### 11. Serialization Tricks

Dzięki właściwości SerializedName można nadpisać wyświetlaną w api nazwę właściwości obiektu:

```
#[SerializedName('description')]
public function setTextDescription(string $description): static
```

W celu utworzenia nowej właściwości można ominąć setter i wstawić ją do konstrukora:

```
private ?string $name = null;
public function __construct(string $name)
{
    $this->name = $name;
    $this->plunderedAt = new \DateTimeImmutable();
}
```

Dzięki temu przesłąnie właściwości jest możliwe, nie jest możliwa edycja. Jest to równoznaczne z dodaniem atrybutu readonly.

### 12. Pagination & Foundry Fixtures

Biblioteki do obsługi fixtures:

> composer require foundry orm-fixtures --dev

Tworzenie fabryki:

> wejście do kontenera
> symfony console make:factory

Uruchomienie fabryki:

> wejście do DataFixtures
> wypełnienie Fixture
> wejście do kontenera
> symfony console do:fi:lo

Aby podejrzeć aktualne konfiguracje trzeba wpisać komendę:

> php bin/console debug:config api_platform

Aby przejrzeć płne drzewo konfiguracji trzeba wpisać komendę:

> php bin/console config:dump api_platform

Ustawienie liczby elementów na stronie odbywa sie przez właściwość paginationItemsPerPage:

```
#[ApiResource(
    shortName: "Treasure",
    description: "A rare and valuable treasure",
    operations: [
        new Get(),
        new GetCollection(),
        new Post(),
        New Put(),
        new Patch(),
        new Delete()
    ],
    normalizationContext: [
        'groups' => ['treasure:read']
    ],
    denormalizationContext: [
        'groups' => ['treasure:write']
    ],
    paginationItemsPerPage: 10
)]
```

### 13. Filters: Searching Results

Filtry można implementować na dwa sposoby:

- deklarując wszystkie wartości dla określonego rodzaju fitra ponad kodem klasy:
  
```
#[ApiFilter(BooleanFilter::class, properties:['isPublished'])]


class DragonTreasure
{
```

- deklarując filtr bezpośrednio nad zmienną (tak jak Groups):

```
#[ORM\Column]
#[ApiFilter(BooleanFilter::class)]
private ?bool $isPublished = false;
```

SearchFilter ma rózne strategie np: 'partial' i 'exact'

```
#[ORM\Column(length: 255)]
#[Groups(['treasure:read', 'treasure:write'])]
#[ApiFilter(SearchFilter::class, strategy: 'partial')]
private ?string $name = null;
```

Partial wyszukuje po %value%, a exact value. Exact umożliwia wyszukiwanie po tablicy elementów.
Deklarując zbiór zmiennych we właściwości properties filtra SearchFilter, można uściślić dla któej wartości poszukuje się dokładnych wartości,a  dla których %value%:

```
#[ApiFilter(SearchFilter::class, properties:['name' => 'exact', 'description' => 'partial'])]
```

### 14. PropertyFilter: Sparse Fieldsets (rzadkie zestawy pól)

Symfony umożliwia zwracanie w apiplatform skróconych wartości stringów np. opisów:

```
#[Groups('treasure:read')]
public function getShortDescription(): ?string
{
    return u($this->description)->truncate(40, "...");
}
```

Jeśli chcemy filtrować konkretne wartości z końcówki apiplatform można użyć PropertyFilter:

```
#[ApiFilter(PropertyFilter::class)]
```

Dokumentacja apiplatform sugeruje, że zamist PropertyFilter lepiej użyć [Vulcain](https://github.com/dunglas/vulcain)

### 15. More Formats: HAL & CSV

Podgląd konfiguracji api_platform:

> php ./bin/console debug:config api_platform

Kolejny obsługiwany format wyświetlania danych można dodać w pliku config/packages/api_platform.yaml

```
api_platform:
    formats:
        jsonld: [ 'application/ld+json' ]
        json: [ 'application/json' ]
        html: [ 'text/html' ]
        jsonhal: [ 'application/hal+json' ]
```

CSV jest formatem, który domyślnie obsługuje serializer symfony (CsvEncoder). Można dodać go z poziomu ApiResource() dla konkretnej encji (co nie zadziała w przypadku jsonhal, pomimo, że hal jest również rozumiany przez serializer):

```
#[ApiResource(
    shortName: "Treasure",
    description: "A rare and valuable treasure",
    operations: [
        new Get(),
        new GetCollection(),
        new Post(),
        New Put(),
        new Patch(),
        new Delete()
    ],
    normalizationContext: [
        'groups' => ['treasure:read']
    ],
    denormalizationContext: [
        'groups' => ['treasure:write']
    ],
    paginationItemsPerPage: 10,
    formats: [
        'jsonld',
        'json',
        'html',
        'jsonhal',
        'csv' => 'text/csv',
    ],
)]
```

### 16. Validation

Walidacja w apiplatform przebiega anbalogicznie jak w symfony:
Dzięki deklaracji Symfony\Component\Validator\Constraints as Assert można użyć Assert z wielomo walidatorami symfony:

```
#[Assert\NotBlank]
#[Assert\Length(min: 2, max: 50, maxMessage: 'Describe your loot in 50 chars or less')]
#[Assert\GreaterThanOrEqual(0)]
#[Assert\LessThanOrEqual(10)]
```

Walidacja Assert pomaga zamieniać błędy serwerowe (5xx) na klienckie (4xx)

### 17. Creating a User Entity

Tworzenie użytkownika w symfony:

> php ./bin/console make:user

Aby edytować encję np. User trzeba wpisać

> php ./bin/console make:entity

Po dodaniu encji należy wykonać migrację:

> symfony console make:migration

> symfony console doctrine:migrations:migrate

Następnie potrzeba danych:

> php bin/console make:factory

Aby dodać trochę sztucznych użytkowników trzeba odać fabrykę do DataFixtures:

```
class AppFixtures extends Fixture
{
    public function load(ObjectManager $manager): void
    {
        DragonTreasureFactory::createMany(40);
        UserFactory::createMany(10);
    }
}
```

Uruchomienie fixture:

> symfony console do:fi:lo

### 18. User API Resource

Do walidacji Usera można skorzystać z kilku dodatkowych sposóbów walidacji:

```
#[UniqueEntity(fields: ['email'], message: 'There is already an account with this email')]
#[UniqueEntity(fields: ['username'], message: 'It looks like another dragon took your username. ROAR!')]
```

```
#[ORM\Column(length: 180, unique: true)]
#[Groups(['user:read', 'user:write'])]
#[Assert\NotBlank]
#[Assert\Email]
private ?string $email = null;
```

### 19. Relating Resources

Dodanie relacji pomiędzy encjami User i DragomTreasure nastąpiło przez edycje encji DragonTreasure:

> php bin/console make:entity

- relacja do User
- nie może być nullem, bo każdy skarb musi mieć właściciela
- czy w encji ma być dostępna metoda $user->getDragonTreasures()

Następnie zmiany muszą być zmigrowane:

> php bin/console make:migration

Mamy stare dane testowe, więc baza powinna zostać wyczyszczona:

> symfony console doctrine:database:drop --force
> symfony console doctrine:database:create

Teraz można wykonać migrację

> symfony console do:mi:mi

Teraz trzeba wstrzyknąć dane z fixures:

Dodajemy do DragonTreasureFactory informacje o właścicielu:

```
protected function getDefaults(): array
{
    return [
        'coolFactor' => self::faker()->numberBetween(1, 10),
        'description' => self::faker()->paragraph(),
        'isPublished' => self::faker()->boolean(),
        'name' => self::faker()->randomElement(self::TREASURE_NAMES),
        'plunderedAt' => \DateTimeImmutable::createFromMutable(self::faker()->dateTimeBetween('-1 year')),
        'value' => self::faker()->numberBetween(1000, 1000000),
        'owner' => UserFactory::new(),
    ];
}
```  

W AppFixtures zmieniono kolejność tworzenia fabryk, a do tworzenia encji DragonStreasure używani są istniejący użytkownicy:

```
class AppFixtures extends Fixture
{
    public function load(ObjectManager $manager): void
    {
        UserFactory::createMany(10);
        DragonTreasureFactory::createMany(40, function() {
            return [
                'owner' => UserFactory::random()
            ];
        });
    }
}
```

> symfony console doctrine:fixtures:load

Po dodanie grup normalizujących do właściwości owner oraz getDragonTreasures() wstrzykiwany jest iri zamiast danych o użytkowniku.

```
{
  "@id": "/api/treasures/3",
  "@type": "Treasure",
  "name": "giant pearl",
  "description": "Ut neque dolores voluptas. Aut expedita necessitatibus dolores dolorem illo.",
  "value": 343,
  "coolFactor": 82267,
  "owner": "/api/users/10",
  "shortDescription": "Ut neque dolores voluptas. Aut expedi...",
  "plunderedAtAgo": "7 years ago"
}
```

```
{
  "@id": "/api/users/1",
  "@type": "User",
  "email": "melyna75@gmail.com",
  "username": "BurnedOut114",
  "dragonTreasures": [
    "/api/treasures/15",
    "/api/treasures/25",
    "/api/treasures/4",
    "/api/treasures/31"
  ]
}
```

### 20. Relations & Iris

Teraz POST oczekuje IRI właściciela, a nie id.

### 21. Embedded Relations

Lista skarbów użytkownika (dragonTreasures) wskazuje tablicę z IRI. Zamiana ich na obiekty to dodanie grupy normalizacji ze skarbów do encji użytkownika:

```
#[ORM\Column(length: 255, unique: true)]
#[Groups(['user:read', 'user:write', 'treasure:read'])]
#[Assert\NotBlank]
private ?string $username = null;
```

Jeśli ma się wyświetlać cały obiekt w końcówce jednego skarbu, to trzeba utworzyć obiekt normalizacji do Get() pojedynczego skarbu:

```
new Get(
    normalizationContext: [
        'groups' => ['treasure:read', 'treasure:item:get'],
    ],
),
```

```
#[ORM\Column(length: 255, unique: true)]
#[Groups(['user:read', 'user:write', 'treasure:read', 'treasure:item:get'])]
#[Assert\NotBlank]
private ?string $username = null;
```

### 22. Embedded Write

Aby zmienic użytkownika do którego jest przypisany skarb, wystarczy w PATCH podać właściwosć owner i przypisać do niej IRI:

```
{
  "owner": "/api/users/1"
}
```

Można zmienić właściwości w encji użytkownika z poziomu skarbu np. nazwę:

```
{
  "owner": {
    "username": "Nowy username"
  }
}
```

### 23. Adding Items to a Collection Property

Dodanie elementó jest klasycznym PATCHem, dodaje sie tablicę ich IRI.

Symfony nie dodaje setDragonTreasures, tylko addDragonTreasure. Nie jest to set, bo sprawdza czy element już istnieje, jeśli istnieje, to go nie dodaje.

### 24. Creating Embedded Objects

Z poziomu encji użytkownika można utworzyć nową instancję skarbu przy tworzeniu nowego użytkownika:

```
{
    "email": "smaug@lonelymountain.com",
    "password": "string",
    "username": "SmaugBrotherhood",
    "dragonTreasures": [
      {
        "name": "Golden Eye for N64",
        "description": "Pure graphics",
        "value": 123456
      }
    ]
}
```

Aby przesłąć zagnieżdżony obiekt potzrebujemy informacji na tej zagnieżdżonej wartości cascade: [\'persist']\:

```
#[ORM\OneToMany(mappedBy: 'owner', targetEntity: DragonTreasure::class, cascade: ['persist'])]
#[Groups(['user:read', 'user:write'])]
#[Assert\Valid]
private Collection $dragonTreasures;
```

Aby dodać PATCH należy:

- ustawić na właściwości powiazanej grupę [\'rodzic:write']\
- we właściwościach zagnieżdżonych które mają być obsłużone również zamieszcza się [\'rodzic:write']\
- Podczas tworzenia obiektu dzieci, serializer tworzy obiekt dziecka, który musi zostać zachowany i trzeba go oznaczyć jako cascade: [\'persist']\ w rodzicu
- Jeśli ma być walidacja, to potrzebujemy #[Assert\Valid]

### 25. Removing Items from a Collection

Podczas edycja (PATCH) obiektu użytkownika, chcę zmienić listę skarbów. Żeby usunąć skarb przesyłam listę skarbów które pozostają.
Pojawia się bład. Skarb musi mieć właściciela. W takim przypadku na obiekcie rodzica umieszcza się właściwość orphanRemoval: true:

```
#[ORM\OneToMany(mappedBy: 'owner', targetEntity: DragonTreasure::class, cascade: ['persist'], orphanRemoval: true)]
#[Groups(['user:read', 'user:write'])]
#[Assert\Valid]
private Collection $dragonTreasures;
```

### 26. Filtering on Relations

Przeszukiwanie w filtrze PropertyFilter wartości dziecka to \[dragonTreasures][]=name.

```
#[ApiFilter(PropertyFilter::class)]
class User implements UserInterface, PasswordAuthenticatedUserInterface
```

Przeszukiwanie dzieci po wartościach rodzica odbywa się przez podanie IRI:

```
#[ApiFilter(SearchFilter::class, strategy: 'exact')]
private ?User $owner = null;
```

Jeśli potrzebuję nazwy użytkownika to mogę dodać opcję:

```
#[ApiFilter(SearchFilter::class, properties: [
    'owner.username' => 'partial',
])]
class DragonTreasure
```

### 27. Subresources

Aby w końcówce treasures pojawiła sie nowa właściwość filtrowania po skarbach przez nazwę użytkownika (chodzi o możliwą paginację skarbów) należy utwporzyć nowe ApiResource:

```
#[ApiResource(
    uriTemplate: '/users/{user_id}/treasures.{_format}',
    shortName: 'Treasure',
    operations: [new GetCollection()],
    uriVariables: [
        'user_id' => new Link(
            fromProperty: 'dragonTreasures',
            fromClass: User::class,
        ),
    ],
)]
```

Jest to odpowiednikiem zapytania sql: SELECT * dragon_treasure WHERE owner_id = {user_id}
Problemem nowego Api mogą być niezgodności w dokumentacji Swaggera. W tym celu można zmienić właściwości openapiContext:

```
openapiContext: [
    'summary' => 'Get historic invoice version',
    'description' => 'Get historic version of a specific invoice',
    'parameters' => [
        [
            'name' => 'index',
            'in' => 'path',
            'description' => 'your description',
            'required' => true,
            'schema' => ['type' => 'string'],
        ]
    ]
],
```

Ponieważ nie było określonej normalizacji dla tego ApiResource, trzeba ją dodać, aby ograniczyć wyświetlanie pól, tylko do wybranych

```
#[ApiResource(
    uriTemplate: '/users/{user_id}/treasures.{_format}',
    shortName: 'Treasure',
    operations: [new GetCollection()],
    uriVariables: [
        'user_id' => new Link(
            fromProperty: 'dragonTreasures',
            fromClass: User::class,
        ),
    ],
    openapiContext: [
        'parameters' => [
            [
                'name' => 'user_id',
                'in' => 'path',
                'description' => 'User Identifier',
            ]
        ]
    ],
    normalizationContext: [
        'groups' => ['treasure:read']
    ],
)]
```

Jeśli chcę znaleźć właściciela skarbu po id samego skarbu używam analigicznie ApiResource:

```
#[ApiResource(
    uriTemplate: '/treasures/{treasure_id}/owner.{_format}',
    shortName: 'User',
    operations: [new Get()],
    uriVariables: [
        'treasure_id' => new Link(
            fromProperty: 'owner',
            fromClass: DragonTreasure::class,
        ),
    ],
    openapiContext: [
        'parameters' => [
            [
                'name' => 'treasure_id',
                'in' => 'path',
                'description' => 'Treasure Identifier',
            ]
        ]
    ],
    normalizationContext: [
        'groups' => ['user:read']
    ],
)]
```

### 28. React Admin

Instalacja panelu admina za pomocą [React Admin](https://marmelab.com/react-admin/)

Spore problemy z React Admin, powodem może być niezgodność wersji biblioteki z użytą w kursie.
Przykład do integracji jest tu:
[https://github.com/api-platform/admin](https://github.com/api-platform/admin)

Trzeba zrobić obsługę jeśli miałoby działać poprawnie.
