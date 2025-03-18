export interface SpinitronUpcomingShow {
  /// The title of the show.
  title: string;
  /// The show timeslot.
  timeslot: string;
  /// The host of the show.
  host: string | null;
  /// The genre of the show.
  genre: string | null;
  /// If this is not a show, just the automated playlist.
  isAutomationBear: boolean;
}

export interface SpinitronShow {
  /// The title of the show.
  title: string;
  /// The description of the show.
  description: string;
  /// The show timeslot.
  timeslot: string;
  /// The host of the show.
  host: string | null;
  /// The genre of the show.
  genre: string | null;
  /// The image of the show.
  image: string | null;
  /// If this is not a show, just the automated playlist.
  isAutomationBear: boolean;
  /// The upcoming shows on the station.
  upcomingShows: SpinitronUpcomingShow[];
}
