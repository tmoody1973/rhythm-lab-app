import { NextResponse } from 'next/server'

// Simple test to show how artist relationships work
export async function GET() {
  try {
    // Example: Parse a track title to find collaborations
    const trackExamples = [
      {
        title: "Baby (feat. Ellie Goulding)",
        artist: "Four Tet",
        parsed: {
          mainArtist: "Four Tet",
          featuredArtist: "Ellie Goulding",
          relationshipType: "featured"
        }
      },
      {
        title: "Sing (Caribou Remix)",
        artist: "Four Tet",
        parsed: {
          mainArtist: "Four Tet",
          remixArtist: "Caribou",
          relationshipType: "remix"
        }
      },
      {
        title: "Nova",
        artist: "Burial & Four Tet",
        parsed: {
          collaborators: ["Burial", "Four Tet"],
          relationshipType: "collaboration"
        }
      }
    ]

    // Show how we extract relationships from Spotify data
    const spotifyExample = {
      track: {
        name: "Only Human",
        artists: [
          { name: "Four Tet", id: "7Eu1txygG6nJttLHbZdQOh" },
          { name: "KH", id: "3x5JT7uM1EaocRtp6XUmEw" }
        ]
      },
      extracted_relationships: [
        {
          artist1: "Four Tet",
          artist2: "KH",
          type: "collaboration",
          evidence: "Only Human (track)",
          source: "spotify"
        }
      ]
    }

    // Show how label relationships work
    const labelExample = {
      label: "Text Records",
      artists: ["Four Tet", "Burial"],
      relationship: {
        type: "label_mate",
        label: "Text Records",
        artists: ["Four Tet", "Burial"]
      }
    }

    return NextResponse.json({
      message: "Artist Relationship Examples",
      track_parsing: trackExamples,
      spotify_extraction: spotifyExample,
      label_relationships: labelExample,

      how_it_works: {
        step1: "When a track is indexed, we parse the title for 'feat.', 'ft.', 'with', etc.",
        step2: "We check Spotify for multiple artist credits on the same track",
        step3: "We query Discogs for detailed production credits",
        step4: "We store these relationships with evidence (which track proves the connection)",
        step5: "When searching, we can show 'Artists who worked with X'"
      },

      database_structure: {
        artist_relationships: "Stores connections between artists",
        track_credits: "Detailed credits for each track",
        label_relationships: "Artists on same labels",
        artist_profiles: "Artist information and metadata"
      }
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}