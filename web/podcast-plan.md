# Create Podcast

POST https://api.elevenlabs.io/v1/studio/podcasts
Content-Type: application/json

Create and auto-convert a podcast project. Currently, the LLM cost is covered by us but you will still be charged for the audio generation. In the future, you will be charged for both the LLM and audio generation costs.

Reference: https://elevenlabs.io/docs/api-reference/studio/create-podcast


the config of elenven labs in env is this :
"callback_url": "https://project0-nu.vercel.app/api/podcast/callback"


ELEVEN_LABS_WEBHOOK_SERCRET,ELEVENLABS_API_KEY,ELEVENLABS_BASE_URL=https://api.elevenlabs.io/v1

## OpenAPI Specification

```yaml
openapi: 3.1.1
info:
  title: Create Podcast
  version: endpoint_studio.create_podcast
paths:
  /v1/studio/podcasts:
    post:
      operationId: create-podcast
      summary: Create Podcast
      description: >-
        Create and auto-convert a podcast project. Currently, the LLM cost is
        covered by us but you will still be charged for the audio generation. In
        the future, you will be charged for both the LLM and audio generation
        costs.
      tags:
        - - subpackage_studio
      parameters:
        - name: xi-api-key
          in: header
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Successful Response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PodcastProjectResponseModel'
        '422':
          description: Validation Error
          content: {}
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Body_Create_podcast_v1_studio_podcasts_post'
components:
  schemas:
    PodcastConversationModeData:
      type: object
      properties:
        host_voice_id:
          type: string
        guest_voice_id:
          type: string
      required:
        - host_voice_id
        - guest_voice_id
    PodcastConversationMode:
      type: object
      properties:
        type:
          type: string
          enum:
            - type: stringLiteral
              value: conversation
        conversation:
          $ref: '#/components/schemas/PodcastConversationModeData'
      required:
        - type
        - conversation
    PodcastBulletinModeData:
      type: object
      properties:
        host_voice_id:
          type: string
      required:
        - host_voice_id
    PodcastBulletinMode:
      type: object
      properties:
        type:
          type: string
          enum:
            - type: stringLiteral
              value: bulletin
        bulletin:
          $ref: '#/components/schemas/PodcastBulletinModeData'
      required:
        - type
        - bulletin
    BodyCreatePodcastV1StudioPodcastsPostMode:
      oneOf:
        - $ref: '#/components/schemas/PodcastConversationMode'
        - $ref: '#/components/schemas/PodcastBulletinMode'
    PodcastTextSource:
      type: object
      properties:
        type:
          type: string
          enum:
            - type: stringLiteral
              value: text
        text:
          type: string
      required:
        - type
        - text
    PodcastURLSource:
      type: object
      properties:
        type:
          type: string
          enum:
            - type: stringLiteral
              value: url
        url:
          type: string
      required:
        - type
        - url
    BodyCreatePodcastV1StudioPodcastsPostSourceOneOf2Items:
      oneOf:
        - $ref: '#/components/schemas/PodcastTextSource'
        - $ref: '#/components/schemas/PodcastURLSource'
    BodyCreatePodcastV1StudioPodcastsPostSource2:
      type: array
      items:
        $ref: >-
          #/components/schemas/BodyCreatePodcastV1StudioPodcastsPostSourceOneOf2Items
    BodyCreatePodcastV1StudioPodcastsPostSource:
      oneOf:
        - $ref: '#/components/schemas/PodcastTextSource'
        - $ref: '#/components/schemas/PodcastURLSource'
        - $ref: '#/components/schemas/BodyCreatePodcastV1StudioPodcastsPostSource2'
    BodyCreatePodcastV1StudioPodcastsPostQualityPreset:
      type: string
      enum:
        - value: standard
        - value: high
        - value: highest
        - value: ultra
        - value: ultra_lossless
    BodyCreatePodcastV1StudioPodcastsPostDurationScale:
      type: string
      enum:
        - value: short
        - value: default
        - value: long
    BodyCreatePodcastV1StudioPodcastsPostApplyTextNormalization:
      type: string
      enum:
        - value: auto
        - value: 'on'
        - value: 'off'
        - value: apply_english
    Body_Create_podcast_v1_studio_podcasts_post:
      type: object
      properties:
        model_id:
          type: string
        mode:
          $ref: '#/components/schemas/BodyCreatePodcastV1StudioPodcastsPostMode'
        source:
          $ref: '#/components/schemas/BodyCreatePodcastV1StudioPodcastsPostSource'
        quality_preset:
          $ref: >-
            #/components/schemas/BodyCreatePodcastV1StudioPodcastsPostQualityPreset
        duration_scale:
          $ref: >-
            #/components/schemas/BodyCreatePodcastV1StudioPodcastsPostDurationScale
        language:
          type:
            - string
            - 'null'
        intro:
          type:
            - string
            - 'null'
        outro:
          type:
            - string
            - 'null'
        instructions_prompt:
          type:
            - string
            - 'null'
        highlights:
          type:
            - array
            - 'null'
          items:
            type: string
        callback_url:
          type:
            - string
            - 'null'
        apply_text_normalization:
          oneOf:
            - $ref: >-
                #/components/schemas/BodyCreatePodcastV1StudioPodcastsPostApplyTextNormalization
            - type: 'null'
      required:
        - model_id
        - mode
        - source
    ProjectResponseModelTargetAudience:
      type: string
      enum:
        - value: children
        - value: young adult
        - value: adult
        - value: all ages
    ProjectState:
      type: string
      enum:
        - value: creating
        - value: default
        - value: converting
        - value: in_queue
    ProjectResponseModelAccessLevel:
      type: string
      enum:
        - value: admin
        - value: editor
        - value: commenter
        - value: viewer
    ProjectResponseModelFiction:
      type: string
      enum:
        - value: fiction
        - value: non-fiction
    ProjectCreationMetaResponseModelStatus:
      type: string
      enum:
        - value: pending
        - value: creating
        - value: finished
        - value: failed
    ProjectCreationMetaResponseModelType:
      type: string
      enum:
        - value: blank
        - value: generate_podcast
        - value: auto_assign_voices
    ProjectCreationMetaResponseModel:
      type: object
      properties:
        creation_progress:
          type: number
          format: double
        status:
          $ref: '#/components/schemas/ProjectCreationMetaResponseModelStatus'
        type:
          $ref: '#/components/schemas/ProjectCreationMetaResponseModelType'
      required:
        - creation_progress
        - status
        - type
    ProjectResponseModelSourceType:
      type: string
      enum:
        - value: blank
        - value: book
        - value: article
        - value: genfm
        - value: video
    CaptionStyleTemplateModel:
      type: object
      properties:
        key:
          type: string
        label:
          type: string
        requires_high_fps:
          type: boolean
      required:
        - key
        - label
    CaptionStyleModelTextAlign:
      type: string
      enum:
        - value: start
        - value: center
        - value: end
    CaptionStyleModelTextStyle:
      type: string
      enum:
        - value: normal
        - value: italic
    CaptionStyleModelTextWeight:
      type: string
      enum:
        - value: normal
        - value: bold
    CaptionStyleSectionAnimationModelEnterType:
      type: string
      enum:
        - value: none
        - value: fade
        - value: scale
    CaptionStyleSectionAnimationModelExitType:
      type: string
      enum:
        - value: none
        - value: fade
        - value: scale
    CaptionStyleSectionAnimationModel:
      type: object
      properties:
        enter_type:
          $ref: '#/components/schemas/CaptionStyleSectionAnimationModelEnterType'
        exit_type:
          $ref: '#/components/schemas/CaptionStyleSectionAnimationModelExitType'
      required:
        - enter_type
        - exit_type
    CaptionStyleWordAnimationModelEnterType:
      type: string
      enum:
        - value: none
        - value: fade
        - value: scale
    CaptionStyleWordAnimationModelExitType:
      type: string
      enum:
        - value: none
        - value: fade
        - value: scale
    CaptionStyleWordAnimationModel:
      type: object
      properties:
        enter_type:
          $ref: '#/components/schemas/CaptionStyleWordAnimationModelEnterType'
        exit_type:
          $ref: '#/components/schemas/CaptionStyleWordAnimationModelExitType'
      required:
        - enter_type
        - exit_type
    CaptionStyleCharacterAnimationModelEnterType:
      type: string
      enum:
        - value: none
        - value: fade
    CaptionStyleCharacterAnimationModelExitType:
      type: string
      enum:
        - value: none
        - value: fade
    CaptionStyleCharacterAnimationModel:
      type: object
      properties:
        enter_type:
          $ref: '#/components/schemas/CaptionStyleCharacterAnimationModelEnterType'
        exit_type:
          $ref: '#/components/schemas/CaptionStyleCharacterAnimationModelExitType'
      required:
        - enter_type
        - exit_type
    CaptionStyleHorizontalPlacementModelAlign:
      type: string
      enum:
        - value: left
        - value: center
        - value: right
    CaptionStyleHorizontalPlacementModel:
      type: object
      properties:
        align:
          $ref: '#/components/schemas/CaptionStyleHorizontalPlacementModelAlign'
        translate_pct:
          type: number
          format: double
      required:
        - align
        - translate_pct
    CaptionStyleVerticalPlacementModelAlign:
      type: string
      enum:
        - value: top
        - value: center
        - value: bottom
    CaptionStyleVerticalPlacementModel:
      type: object
      properties:
        align:
          $ref: '#/components/schemas/CaptionStyleVerticalPlacementModelAlign'
        translate_pct:
          type: number
          format: double
      required:
        - align
        - translate_pct
    CaptionStyleModel:
      type: object
      properties:
        template:
          oneOf:
            - $ref: '#/components/schemas/CaptionStyleTemplateModel'
            - type: 'null'
        text_font:
          type:
            - string
            - 'null'
        text_scale:
          type:
            - number
            - 'null'
          format: double
        text_color:
          type:
            - string
            - 'null'
        text_align:
          oneOf:
            - $ref: '#/components/schemas/CaptionStyleModelTextAlign'
            - type: 'null'
        text_style:
          oneOf:
            - $ref: '#/components/schemas/CaptionStyleModelTextStyle'
            - type: 'null'
        text_weight:
          oneOf:
            - $ref: '#/components/schemas/CaptionStyleModelTextWeight'
            - type: 'null'
        background_enabled:
          type:
            - boolean
            - 'null'
        background_color:
          type:
            - string
            - 'null'
        background_opacity:
          type:
            - number
            - 'null'
          format: double
        word_highlights_enabled:
          type:
            - boolean
            - 'null'
        word_highlights_color:
          type:
            - string
            - 'null'
        word_highlights_background_color:
          type:
            - string
            - 'null'
        word_highlights_opacity:
          type:
            - number
            - 'null'
          format: double
        section_animation:
          oneOf:
            - $ref: '#/components/schemas/CaptionStyleSectionAnimationModel'
            - type: 'null'
        word_animation:
          oneOf:
            - $ref: '#/components/schemas/CaptionStyleWordAnimationModel'
            - type: 'null'
        character_animation:
          oneOf:
            - $ref: '#/components/schemas/CaptionStyleCharacterAnimationModel'
            - type: 'null'
        width_pct:
          type:
            - number
            - 'null'
          format: double
        horizontal_placement:
          oneOf:
            - $ref: '#/components/schemas/CaptionStyleHorizontalPlacementModel'
            - type: 'null'
        vertical_placement:
          oneOf:
            - $ref: '#/components/schemas/CaptionStyleVerticalPlacementModel'
            - type: 'null'
        auto_break_enabled:
          type:
            - boolean
            - 'null'
        max_lines_per_section:
          type:
            - integer
            - 'null'
        max_words_per_line:
          type:
            - integer
            - 'null'
    ProjectResponseModelAspectRatio:
      type: string
      enum:
        - value: '16:9'
        - value: '9:16'
        - value: '4:5'
        - value: '1:1'
    ProjectResponseModel:
      type: object
      properties:
        project_id:
          type: string
        name:
          type: string
        create_date_unix:
          type: integer
        default_title_voice_id:
          type: string
        default_paragraph_voice_id:
          type: string
        default_model_id:
          type: string
        last_conversion_date_unix:
          type:
            - integer
            - 'null'
        can_be_downloaded:
          type: boolean
        title:
          type:
            - string
            - 'null'
        author:
          type:
            - string
            - 'null'
        description:
          type:
            - string
            - 'null'
        genres:
          type:
            - array
            - 'null'
          items:
            type: string
        cover_image_url:
          type:
            - string
            - 'null'
        target_audience:
          oneOf:
            - $ref: '#/components/schemas/ProjectResponseModelTargetAudience'
            - type: 'null'
        language:
          type:
            - string
            - 'null'
        content_type:
          type:
            - string
            - 'null'
        original_publication_date:
          type:
            - string
            - 'null'
        mature_content:
          type:
            - boolean
            - 'null'
        isbn_number:
          type:
            - string
            - 'null'
        volume_normalization:
          type: boolean
        state:
          $ref: '#/components/schemas/ProjectState'
        access_level:
          $ref: '#/components/schemas/ProjectResponseModelAccessLevel'
        fiction:
          oneOf:
            - $ref: '#/components/schemas/ProjectResponseModelFiction'
            - type: 'null'
        quality_check_on:
          type: boolean
        quality_check_on_when_bulk_convert:
          type: boolean
        creation_meta:
          oneOf:
            - $ref: '#/components/schemas/ProjectCreationMetaResponseModel'
            - type: 'null'
        source_type:
          oneOf:
            - $ref: '#/components/schemas/ProjectResponseModelSourceType'
            - type: 'null'
        chapters_enabled:
          type:
            - boolean
            - 'null'
        captions_enabled:
          type:
            - boolean
            - 'null'
        caption_style:
          oneOf:
            - $ref: '#/components/schemas/CaptionStyleModel'
            - type: 'null'
        public_share_id:
          type:
            - string
            - 'null'
        aspect_ratio:
          oneOf:
            - $ref: '#/components/schemas/ProjectResponseModelAspectRatio'
            - type: 'null'
      required:
        - project_id
        - name
        - create_date_unix
        - default_title_voice_id
        - default_paragraph_voice_id
        - default_model_id
        - can_be_downloaded
        - volume_normalization
        - state
        - access_level
        - quality_check_on
        - quality_check_on_when_bulk_convert
    PodcastProjectResponseModel:
      type: object
      properties:
        project:
          $ref: '#/components/schemas/ProjectResponseModel'
      required:
        - project

```

## SDK Code Examples

```go
package main

import (
	"fmt"
	"strings"
	"net/http"
	"io"
)

func main() {

	url := "https://api.elevenlabs.io/v1/studio/podcasts"

	payload := strings.NewReader("{\n  \"model_id\": \"eleven_multilingual_v2\",\n  \"mode\": {\n    \"type\": \"string\",\n    \"conversation\": {\n      \"host_voice_id\": \"string\",\n      \"guest_voice_id\": \"string\"\n    }\n  },\n  \"source\": {\n    \"type\": \"string\",\n    \"text\": \"string\"\n  }\n}")

	req, _ := http.NewRequest("POST", url, payload)

	req.Header.Add("xi-api-key", "xi-api-key")
	req.Header.Add("Content-Type", "application/json")

	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))

}
```

```ruby
require 'uri'
require 'net/http'

url = URI("https://api.elevenlabs.io/v1/studio/podcasts")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true

request = Net::HTTP::Post.new(url)
request["xi-api-key"] = 'xi-api-key'
request["Content-Type"] = 'application/json'
request.body = "{\n  \"model_id\": \"eleven_multilingual_v2\",\n  \"mode\": {\n    \"type\": \"string\",\n    \"conversation\": {\n      \"host_voice_id\": \"string\",\n      \"guest_voice_id\": \"string\"\n    }\n  },\n  \"source\": {\n    \"type\": \"string\",\n    \"text\": \"string\"\n  }\n}"

response = http.request(request)
puts response.read_body
```

```java
HttpResponse<String> response = Unirest.post("https://api.elevenlabs.io/v1/studio/podcasts")
  .header("xi-api-key", "xi-api-key")
  .header("Content-Type", "application/json")
  .body("{\n  \"model_id\": \"eleven_multilingual_v2\",\n  \"mode\": {\n    \"type\": \"string\",\n    \"conversation\": {\n      \"host_voice_id\": \"string\",\n      \"guest_voice_id\": \"string\"\n    }\n  },\n  \"source\": {\n    \"type\": \"string\",\n    \"text\": \"string\"\n  }\n}")
  .asString();
```

```php
<?php

$client = new \GuzzleHttp\Client();

$response = $client->request('POST', 'https://api.elevenlabs.io/v1/studio/podcasts', [
  'body' => '{
  "model_id": "eleven_multilingual_v2",
  "mode": {
    "type": "string",
    "conversation": {
      "host_voice_id": "string",
      "guest_voice_id": "string"
    }
  },
  "source": {
    "type": "string",
    "text": "string"
  }
}',
  'headers' => [
    'Content-Type' => 'application/json',
    'xi-api-key' => 'xi-api-key',
  ],
]);

echo $response->getBody();
```

```csharp
var client = new RestClient("https://api.elevenlabs.io/v1/studio/podcasts");
var request = new RestRequest(Method.POST);
request.AddHeader("xi-api-key", "xi-api-key");
request.AddHeader("Content-Type", "application/json");
request.AddParameter("application/json", "{\n  \"model_id\": \"eleven_multilingual_v2\",\n  \"mode\": {\n    \"type\": \"string\",\n    \"conversation\": {\n      \"host_voice_id\": \"string\",\n      \"guest_voice_id\": \"string\"\n    }\n  },\n  \"source\": {\n    \"type\": \"string\",\n    \"text\": \"string\"\n  }\n}", ParameterType.RequestBody);
IRestResponse response = client.Execute(request);
```

```swift
import Foundation

let headers = [
  "xi-api-key": "xi-api-key",
  "Content-Type": "application/json"
]
let parameters = [
  "model_id": "eleven_multilingual_v2",
  "mode": [
    "type": "string",
    "conversation": [
      "host_voice_id": "string",
      "guest_voice_id": "string"
    ]
  ],
  "source": [
    "type": "string",
    "text": "string"
  ]
] as [String : Any]

let postData = JSONSerialization.data(withJSONObject: parameters, options: [])

let request = NSMutableURLRequest(url: NSURL(string: "https://api.elevenlabs.io/v1/studio/podcasts")! as URL,
                                        cachePolicy: .useProtocolCachePolicy,
                                    timeoutInterval: 10.0)
request.httpMethod = "POST"
request.allHTTPHeaderFields = headers
request.httpBody = postData as Data

let session = URLSession.shared
let dataTask = session.dataTask(with: request as URLRequest, completionHandler: { (data, response, error) -> Void in
  if (error != nil) {
    print(error as Any)
  } else {
    let httpResponse = response as? HTTPURLResponse
    print(httpResponse)
  }
})

dataTask.resume()
```

```typescript
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

async function main() {
    const client = new ElevenLabsClient({
        environment: "https://api.elevenlabs.io",
    });
    await client.studio.createPodcast({
        modelId: "eleven_multilingual_v2",
        source: {
            text: "string",
        },
    });
}
main();

```

```python
from elevenlabs import ElevenLabs

client = ElevenLabs(
    base_url="https://api.elevenlabs.io"
)

client.studio.create_podcast(
    model_id="eleven_multilingual_v2",
    mode=,
    source={
        "text": "string"
    }
)

```